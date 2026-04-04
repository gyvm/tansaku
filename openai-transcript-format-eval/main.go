package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

const responsesAPIURL = "https://api.openai.com/v1/responses"

type scenario struct {
	ID                    string   `json:"id"`
	Title                 string   `json:"title"`
	Model                 string   `json:"model"`
	SourceType            string   `json:"source_type"`
	PromptStrategy        string   `json:"prompt_strategy"`
	InputFile             string   `json:"input_file"`
	AudioLengthMinutes    float64  `json:"audio_length_minutes"`
	Notes                 string   `json:"notes,omitempty"`
	InputPricePer1MUSD    float64  `json:"input_price_per_1m_usd,omitempty"`
	OutputPricePer1MUSD   float64  `json:"output_price_per_1m_usd,omitempty"`
	ExpectedSpeakers      int      `json:"expected_speakers,omitempty"`
	ManualQualityScore    *int     `json:"manual_quality_score,omitempty"`
	AdditionalConstraints []string `json:"additional_constraints,omitempty"`
}

type result struct {
	ID                  string    `json:"id"`
	Title               string    `json:"title"`
	Model               string    `json:"model"`
	SourceType          string    `json:"source_type"`
	PromptStrategy      string    `json:"prompt_strategy"`
	InputFile           string    `json:"input_file"`
	AudioLengthMinutes  float64   `json:"audio_length_minutes"`
	InputCharacters     int       `json:"input_characters"`
	ResponseID          string    `json:"response_id,omitempty"`
	Status              string    `json:"status,omitempty"`
	ElapsedMS           int64     `json:"elapsed_ms"`
	Usage               usage     `json:"usage"`
	CostUSD             float64   `json:"cost_usd"`
	FormattedTranscript string    `json:"formatted_transcript,omitempty"`
	CleanupNotes        []string  `json:"cleanup_notes,omitempty"`
	QualityRisks        []string  `json:"quality_risks,omitempty"`
	RawModelOutput      string    `json:"raw_model_output,omitempty"`
	JSONParseError      string    `json:"json_parse_error,omitempty"`
	ManualQualityScore  *int      `json:"manual_quality_score,omitempty"`
	PromptPreview       string    `json:"prompt_preview,omitempty"`
	GeneratedAt         time.Time `json:"generated_at"`
	Err                 string    `json:"error,omitempty"`
}

type usage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
	TotalTokens  int `json:"total_tokens"`
}

type modelPrices struct {
	InputPer1MUSD  float64
	OutputPer1MUSD float64
}

type responseRequest struct {
	Model string         `json:"model"`
	Input []inputMessage `json:"input"`
}

type inputMessage struct {
	Role    string         `json:"role"`
	Content []inputContent `json:"content"`
}

type inputContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type responseEnvelope struct {
	ID     string               `json:"id"`
	Status string               `json:"status"`
	Error  *responseError       `json:"error,omitempty"`
	Usage  responseUsage        `json:"usage"`
	Output []responseOutputItem `json:"output"`
}

type responseError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type responseUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
	TotalTokens  int `json:"total_tokens"`
}

type responseOutputItem struct {
	Type    string                 `json:"type"`
	Role    string                 `json:"role,omitempty"`
	Content []responseOutputText   `json:"content,omitempty"`
	Summary []responseOutputText   `json:"summary,omitempty"`
	Status  string                 `json:"status,omitempty"`
	Extra   map[string]interface{} `json:"-"`
}

type responseOutputText struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

type errorEnvelope struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    any    `json:"code"`
	} `json:"error"`
}

type formattedPayload struct {
	FormattedTranscript string   `json:"formatted_transcript"`
	CleanupNotes        []string `json:"cleanup_notes"`
	QualityRisks        []string `json:"quality_risks"`
}

var defaultModelPrices = map[string]modelPrices{
	"gpt-4o-mini": {InputPer1MUSD: 0.15, OutputPer1MUSD: 0.60},
	"gpt-4o":      {InputPer1MUSD: 2.50, OutputPer1MUSD: 10.00},
}

func main() {
	var (
		configPath = flag.String("config", "scenarios.example.json", "Path to the scenario JSON file")
		outPath    = flag.String("out", "results.json", "Path to write JSON results")
		reportPath = flag.String("report", "report.md", "Path to write the Markdown report")
		csvPath    = flag.String("csv", "metrics.csv", "Path to write the CSV metrics")
		scenarioID = flag.String("scenario", "", "Optional scenario ID to run, for example 07")
		timeout    = flag.Duration("timeout", 2*time.Minute, "HTTP timeout per request")
	)
	flag.Parse()

	apiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if apiKey == "" {
		exitf("OPENAI_API_KEY is not set")
	}

	scenarios, err := loadScenarios(*configPath)
	if err != nil {
		exitf("load scenarios: %v", err)
	}
	if len(scenarios) == 0 {
		exitf("no scenarios found in %s", *configPath)
	}
	if strings.TrimSpace(*scenarioID) != "" {
		scenarios = filterScenarios(scenarios, strings.TrimSpace(*scenarioID))
		if len(scenarios) == 0 {
			exitf("scenario %s was not found in %s", *scenarioID, *configPath)
		}
	}

	client := &http.Client{Timeout: *timeout}
	results := make([]result, 0, len(scenarios))
	baseDir := filepathDir(*configPath)

	for _, s := range scenarios {
		r := runScenario(context.Background(), client, apiKey, s, baseDir)
		results = append(results, r)
		printResult(r)
	}

	if err := writeJSON(*outPath, results); err != nil {
		exitf("write JSON: %v", err)
	}
	if err := writeCSV(*csvPath, results); err != nil {
		exitf("write CSV: %v", err)
	}
	if err := writeMarkdownReport(*reportPath, results); err != nil {
		exitf("write report: %v", err)
	}

	fmt.Printf("\nWrote JSON results to %s\n", *outPath)
	fmt.Printf("Wrote CSV metrics to %s\n", *csvPath)
	fmt.Printf("Wrote Markdown report to %s\n", *reportPath)
}

func loadScenarios(path string) ([]scenario, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var scenarios []scenario
	if err := json.Unmarshal(data, &scenarios); err != nil {
		return nil, err
	}

	for i, s := range scenarios {
		if strings.TrimSpace(s.ID) == "" {
			return nil, fmt.Errorf("scenario[%d]: id is required", i)
		}
		if strings.TrimSpace(s.Title) == "" {
			return nil, fmt.Errorf("scenario[%d]: title is required", i)
		}
		if strings.TrimSpace(s.Model) == "" {
			return nil, fmt.Errorf("scenario[%d]: model is required", i)
		}
		if strings.TrimSpace(s.SourceType) == "" {
			return nil, fmt.Errorf("scenario[%d]: source_type is required", i)
		}
		if strings.TrimSpace(s.PromptStrategy) == "" {
			return nil, fmt.Errorf("scenario[%d]: prompt_strategy is required", i)
		}
		if strings.TrimSpace(s.InputFile) == "" {
			return nil, fmt.Errorf("scenario[%d]: input_file is required", i)
		}
		if s.AudioLengthMinutes <= 0 {
			return nil, fmt.Errorf("scenario[%d]: audio_length_minutes must be > 0", i)
		}
	}

	sort.Slice(scenarios, func(i, j int) bool {
		return scenarios[i].ID < scenarios[j].ID
	})
	return scenarios, nil
}

func filterScenarios(scenarios []scenario, id string) []scenario {
	filtered := make([]scenario, 0, 1)
	for _, s := range scenarios {
		if s.ID == id {
			filtered = append(filtered, s)
		}
	}
	return filtered
}

func runScenario(ctx context.Context, client *http.Client, apiKey string, s scenario, baseDir string) result {
	start := time.Now()
	inputPath := resolvePath(baseDir, s.InputFile)
	r := result{
		ID:                 s.ID,
		Title:              s.Title,
		Model:              s.Model,
		SourceType:         s.SourceType,
		PromptStrategy:     s.PromptStrategy,
		InputFile:          inputPath,
		AudioLengthMinutes: s.AudioLengthMinutes,
		ManualQualityScore: s.ManualQualityScore,
		GeneratedAt:        time.Now().UTC(),
	}

	rawText, err := os.ReadFile(inputPath)
	if err != nil {
		r.ElapsedMS = time.Since(start).Milliseconds()
		r.Err = fmt.Sprintf("read input file: %v", err)
		return r
	}

	inputText := strings.TrimSpace(string(rawText))
	r.InputCharacters = len([]rune(inputText))

	request := buildRequest(s, inputText)
	r.PromptPreview = buildPromptPreview(request)

	response, rawOutput, err := createResponse(ctx, client, apiKey, request)
	r.ElapsedMS = time.Since(start).Milliseconds()
	if err != nil {
		r.Err = err.Error()
		return r
	}

	r.ResponseID = response.ID
	r.Status = response.Status
	r.Usage = usage{
		InputTokens:  response.Usage.InputTokens,
		OutputTokens: response.Usage.OutputTokens,
		TotalTokens:  response.Usage.TotalTokens,
	}
	r.CostUSD = estimateCostUSD(s, r.Usage)
	r.RawModelOutput = rawOutput

	payload, parseErr := parseFormattedPayload(rawOutput)
	if parseErr != nil {
		r.JSONParseError = parseErr.Error()
		return r
	}

	r.FormattedTranscript = payload.FormattedTranscript
	r.CleanupNotes = payload.CleanupNotes
	r.QualityRisks = payload.QualityRisks
	return r
}

func buildRequest(s scenario, rawTranscript string) responseRequest {
	messages := []inputMessage{
		{
			Role: "developer",
			Content: []inputContent{{
				Type: "input_text",
				Text: buildDeveloperPrompt(s),
			}},
		},
	}

	if s.PromptStrategy == "few-shot" {
		exampleRaw, exampleCleaned := fewShotExample()
		messages = append(messages,
			inputMessage{
				Role: "user",
				Content: []inputContent{{
					Type: "input_text",
					Text: "Example transcript to clean:\n" + exampleRaw,
				}},
			},
			inputMessage{
				Role: "assistant",
				Content: []inputContent{{
					Type: "input_text",
					Text: exampleCleaned,
				}},
			},
		)
	}

	messages = append(messages, inputMessage{
		Role: "user",
		Content: []inputContent{{
			Type: "input_text",
			Text: buildUserPrompt(s, rawTranscript),
		}},
	})

	return responseRequest{
		Model: s.Model,
		Input: messages,
	}
}

func buildDeveloperPrompt(s scenario) string {
	var b strings.Builder
	b.WriteString("You clean Japanese meeting transcripts before minutes generation.\n")
	b.WriteString("Your job is formatting only, not summarization.\n")
	b.WriteString("Remove fillers, obvious speech-recognition mistakes, duplicated fragments, timestamp noise, and accidental line breaks.\n")
	b.WriteString("Keep business meaning, decisions, owners, dates, numbers, risks, and action items intact.\n")
	b.WriteString("Do not invent facts that are not grounded in the input transcript.\n")
	b.WriteString("Return JSON only with keys: formatted_transcript, cleanup_notes, quality_risks.\n")
	b.WriteString("formatted_transcript must be a plain Japanese transcript string ready for downstream minutes generation.\n")
	b.WriteString("cleanup_notes must be a short array describing what cleanup you applied.\n")
	b.WriteString("quality_risks must be a short array describing remaining ambiguities, if any.\n")

	switch s.SourceType {
	case "whisper_raw":
		b.WriteString("The source is a raw Whisper-style transcript with weak punctuation and occasional misrecognitions.\n")
	case "zoom_transcript":
		b.WriteString("The source is pasted from Zoom captions. Strip timestamps and preserve speaker names when present.\n")
	case "google_meet_transcript":
		b.WriteString("The source is pasted from Google Meet captions. Strip timestamps and system noise while preserving content.\n")
	}

	switch s.PromptStrategy {
	case "zero-shot":
		b.WriteString("Use a zero-shot cleanup strategy.\n")
	case "few-shot":
		b.WriteString("Follow the cleanup style shown in the example conversation.\n")
	case "speaker-labels":
		b.WriteString("Add consistent speaker labels such as 田中, 佐藤, 鈴木, 伊藤 when the speaker is inferable; otherwise use 発言者A/B/C.\n")
	}

	if s.ExpectedSpeakers > 0 {
		fmt.Fprintf(&b, "Assume about %d active speakers in the meeting.\n", s.ExpectedSpeakers)
	}

	for _, c := range s.AdditionalConstraints {
		b.WriteString(c)
		if !strings.HasSuffix(c, "\n") {
			b.WriteString("\n")
		}
	}

	return b.String()
}

func buildUserPrompt(s scenario, rawTranscript string) string {
	var b strings.Builder
	fmt.Fprintf(&b, "Scenario ID: %s\n", s.ID)
	fmt.Fprintf(&b, "Scenario title: %s\n", s.Title)
	fmt.Fprintf(&b, "Audio length minutes: %.0f\n", s.AudioLengthMinutes)
	fmt.Fprintf(&b, "Source type: %s\n", s.SourceType)
	fmt.Fprintf(&b, "Prompt strategy: %s\n", s.PromptStrategy)
	b.WriteString("\nRaw transcript begins below.\n")
	b.WriteString("```text\n")
	b.WriteString(rawTranscript)
	b.WriteString("\n```\n")
	return b.String()
}

func fewShotExample() (string, string) {
	raw := "00:00 田中 えっと まず今週のリリースなんですけど たぶん木曜 いや金曜かな 7日ですね で APIのレート制限は いちおう 1分600 じゃなくて 60です すみません 60 req です"
	cleaned := `{"formatted_transcript":"田中: 今週のリリース日は4月7日金曜です。APIのレート制限は1分あたり60リクエストです。","cleanup_notes":["フィラーを削除した","日付と数値の言い直しを解消した","読みづらい区切りを補正した"],"quality_risks":[]}`
	return raw, cleaned
}

func createResponse(ctx context.Context, client *http.Client, apiKey string, reqBody responseRequest) (responseEnvelope, string, error) {
	var zero responseEnvelope

	body, err := json.Marshal(reqBody)
	if err != nil {
		return zero, "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, responsesAPIURL, bytes.NewReader(body))
	if err != nil {
		return zero, "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return zero, "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, "", err
	}

	if resp.StatusCode >= 400 {
		var apiErr errorEnvelope
		if err := json.Unmarshal(respBody, &apiErr); err == nil && apiErr.Error.Message != "" {
			return zero, "", fmt.Errorf("api error (%d): %s", resp.StatusCode, apiErr.Error.Message)
		}
		return zero, "", fmt.Errorf("api error (%d): %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	if err := json.Unmarshal(respBody, &zero); err != nil {
		return zero, "", fmt.Errorf("decode response: %w", err)
	}
	if zero.Error != nil && zero.Error.Message != "" {
		return zero, "", fmt.Errorf("response error: %s", zero.Error.Message)
	}

	outputText := extractOutputText(zero.Output)
	if strings.TrimSpace(outputText) == "" {
		return zero, "", errors.New("empty model output")
	}
	return zero, outputText, nil
}

func extractOutputText(items []responseOutputItem) string {
	var parts []string
	for _, item := range items {
		for _, content := range item.Content {
			if strings.TrimSpace(content.Text) != "" {
				parts = append(parts, content.Text)
			}
		}
		for _, summary := range item.Summary {
			if strings.TrimSpace(summary.Text) != "" {
				parts = append(parts, summary.Text)
			}
		}
	}
	return strings.TrimSpace(strings.Join(parts, "\n"))
}

func parseFormattedPayload(raw string) (formattedPayload, error) {
	var payload formattedPayload
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return payload, errors.New("empty output")
	}

	trimmed = strings.TrimPrefix(trimmed, "```json")
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimSuffix(trimmed, "```")
	trimmed = strings.TrimSpace(trimmed)

	start := strings.Index(trimmed, "{")
	end := strings.LastIndex(trimmed, "}")
	if start < 0 || end < start {
		return payload, errors.New("model output does not contain a JSON object")
	}

	if err := json.Unmarshal([]byte(trimmed[start:end+1]), &payload); err != nil {
		return payload, err
	}
	if strings.TrimSpace(payload.FormattedTranscript) == "" {
		return payload, errors.New("formatted_transcript is empty")
	}
	return payload, nil
}

func estimateCostUSD(s scenario, u usage) float64 {
	price := defaultModelPrices[s.Model]
	if s.InputPricePer1MUSD > 0 {
		price.InputPer1MUSD = s.InputPricePer1MUSD
	}
	if s.OutputPricePer1MUSD > 0 {
		price.OutputPer1MUSD = s.OutputPricePer1MUSD
	}

	inputCost := (float64(u.InputTokens) / 1_000_000.0) * price.InputPer1MUSD
	outputCost := (float64(u.OutputTokens) / 1_000_000.0) * price.OutputPer1MUSD
	return round6(inputCost + outputCost)
}

func resolvePath(baseDir, p string) string {
	if filepathIsAbs(p) {
		return p
	}
	if baseDir == "" {
		return p
	}
	return strings.TrimPrefix(baseDir+"/"+p, "./")
}

func filepathDir(path string) string {
	idx := strings.LastIndex(path, "/")
	if idx < 0 {
		return "."
	}
	if idx == 0 {
		return "/"
	}
	return path[:idx]
}

func filepathIsAbs(path string) bool {
	return strings.HasPrefix(path, "/")
}

func writeJSON(path string, results []result) error {
	data, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

func writeCSV(path string, results []result) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	w := csv.NewWriter(file)
	defer w.Flush()

	header := []string{
		"id",
		"title",
		"model",
		"source_type",
		"prompt_strategy",
		"audio_length_minutes",
		"input_characters",
		"input_tokens",
		"output_tokens",
		"total_tokens",
		"cost_usd",
		"manual_quality_score",
		"status",
		"error",
	}
	if err := w.Write(header); err != nil {
		return err
	}

	for _, r := range results {
		score := ""
		if r.ManualQualityScore != nil {
			score = strconv.Itoa(*r.ManualQualityScore)
		}
		row := []string{
			r.ID,
			r.Title,
			r.Model,
			r.SourceType,
			r.PromptStrategy,
			strconv.FormatFloat(r.AudioLengthMinutes, 'f', 0, 64),
			strconv.Itoa(r.InputCharacters),
			strconv.Itoa(r.Usage.InputTokens),
			strconv.Itoa(r.Usage.OutputTokens),
			strconv.Itoa(r.Usage.TotalTokens),
			fmt.Sprintf("%.6f", r.CostUSD),
			score,
			r.Status,
			r.Err,
		}
		if err := w.Write(row); err != nil {
			return err
		}
	}

	w.Flush()
	return w.Error()
}

func writeMarkdownReport(path string, results []result) error {
	var b strings.Builder
	b.WriteString("# Transcript Formatting Evaluation Report\n\n")
	b.WriteString("| ID | Model | Source | Strategy | Input chars | Input tokens | Output tokens | Cost (USD) | Quality score |\n")
	b.WriteString("| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |\n")
	for _, r := range results {
		score := ""
		if r.ManualQualityScore != nil {
			score = strconv.Itoa(*r.ManualQualityScore)
		}
		fmt.Fprintf(&b, "| %s | %s | %s | %s | %d | %d | %d | %.6f | %s |\n",
			r.ID, r.Model, r.SourceType, r.PromptStrategy, r.InputCharacters, r.Usage.InputTokens, r.Usage.OutputTokens, r.CostUSD, score)
	}
	b.WriteString("\n")

	for _, r := range results {
		fmt.Fprintf(&b, "## %s %s\n\n", r.ID, r.Title)
		fmt.Fprintf(&b, "- Status: %s\n", valueOr(r.Status, "n/a"))
		fmt.Fprintf(&b, "- Audio length: %.0f minutes\n", r.AudioLengthMinutes)
		fmt.Fprintf(&b, "- Input file: %s\n", r.InputFile)
		fmt.Fprintf(&b, "- Prompt strategy: %s\n", r.PromptStrategy)
		fmt.Fprintf(&b, "- Tokens: input=%d output=%d total=%d\n", r.Usage.InputTokens, r.Usage.OutputTokens, r.Usage.TotalTokens)
		fmt.Fprintf(&b, "- Cost: %.6f USD\n", r.CostUSD)
		if r.Err != "" {
			fmt.Fprintf(&b, "- Error: %s\n\n", r.Err)
			continue
		}
		if r.JSONParseError != "" {
			fmt.Fprintf(&b, "- JSON parse error: %s\n\n", r.JSONParseError)
			b.WriteString("Raw output:\n\n```json\n")
			b.WriteString(r.RawModelOutput)
			b.WriteString("\n```\n\n")
			continue
		}

		if len(r.CleanupNotes) > 0 {
			b.WriteString("- Cleanup notes:\n")
			for _, note := range r.CleanupNotes {
				fmt.Fprintf(&b, "  - %s\n", note)
			}
		}
		if len(r.QualityRisks) > 0 {
			b.WriteString("- Remaining risks:\n")
			for _, risk := range r.QualityRisks {
				fmt.Fprintf(&b, "  - %s\n", risk)
			}
		}
		b.WriteString("\nFormatted transcript preview:\n\n```text\n")
		b.WriteString(truncateRunes(r.FormattedTranscript, 600))
		b.WriteString("\n```\n\n")
	}

	return os.WriteFile(path, []byte(b.String()), 0o644)
}

func buildPromptPreview(req responseRequest) string {
	data, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		return ""
	}
	return truncateRunes(string(data), 1200)
}

func printResult(r result) {
	fmt.Printf("\n[%s] %s\n", r.ID, r.Title)
	fmt.Printf("model=%s source=%s strategy=%s elapsed=%dms\n", r.Model, r.SourceType, r.PromptStrategy, r.ElapsedMS)
	fmt.Printf("input_chars=%d input_tokens=%d output_tokens=%d cost=%.6f USD\n", r.InputCharacters, r.Usage.InputTokens, r.Usage.OutputTokens, r.CostUSD)
	if r.Err != "" {
		fmt.Printf("error=%s\n", r.Err)
		return
	}
	if r.JSONParseError != "" {
		fmt.Printf("json_parse_error=%s\n", r.JSONParseError)
		fmt.Println("raw_output:")
		fmt.Println(r.RawModelOutput)
		return
	}
	fmt.Println("formatted_preview:")
	fmt.Println(truncateRunes(r.FormattedTranscript, 220))
}

func valueOr(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func truncateRunes(s string, max int) string {
	runes := []rune(strings.TrimSpace(s))
	if len(runes) <= max {
		return string(runes)
	}
	return string(runes[:max]) + "..."
}

func round6(v float64) float64 {
	out, _ := strconv.ParseFloat(fmt.Sprintf("%.6f", v), 64)
	return out
}

func exitf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
