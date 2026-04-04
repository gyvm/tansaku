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
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const apiURL = "https://api.openai.com/v1/audio/transcriptions"

type scenario struct {
	ID                    string `json:"id"`
	Title                 string `json:"title"`
	Model                 string `json:"model"`
	Audio                 string `json:"audio"`
	Language              string `json:"language,omitempty"`
	Prompt                string `json:"prompt,omitempty"`
	Notes                 string `json:"notes,omitempty"`
	FormattedInputTokens  *int   `json:"formatted_input_tokens,omitempty"`
	FormattedOutputTokens *int   `json:"formatted_output_tokens,omitempty"`
	SubjectiveQuality     *int   `json:"subjective_quality_score,omitempty"`
	QualityNote           string `json:"quality_note,omitempty"`
}

type successResponse struct {
	Text     string      `json:"text"`
	Duration float64     `json:"duration,omitempty"`
	Usage    usageObject `json:"usage,omitempty"`
}

type errorEnvelope struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    any    `json:"code"`
	} `json:"error"`
}

type result struct {
	ID                    string        `json:"id"`
	Title                 string        `json:"title"`
	Model                 string        `json:"model"`
	Audio                 string        `json:"audio"`
	Language              string        `json:"language,omitempty"`
	Notes                 string        `json:"notes,omitempty"`
	Elapsed               time.Duration `json:"elapsed"`
	Transcript            string        `json:"transcript,omitempty"`
	TranscriptCharCount   int           `json:"transcript_char_count,omitempty"`
	AudioDurationSeconds  float64       `json:"audio_duration_seconds,omitempty"`
	AudioDurationMinutes  float64       `json:"audio_duration_minutes,omitempty"`
	APIUsageType          string        `json:"api_usage_type,omitempty"`
	APIInputTokens        int           `json:"api_input_tokens,omitempty"`
	APIOutputTokens       int           `json:"api_output_tokens,omitempty"`
	APITotalTokens        int           `json:"api_total_tokens,omitempty"`
	APIAudioTokens        int           `json:"api_audio_tokens,omitempty"`
	APITextTokens         int           `json:"api_text_tokens,omitempty"`
	FormattedInputTokens  *int          `json:"formatted_input_tokens,omitempty"`
	FormattedOutputTokens *int          `json:"formatted_output_tokens,omitempty"`
	ActualCostUSD         float64       `json:"actual_cost_usd,omitempty"`
	SubjectiveQuality     *int          `json:"subjective_quality_score,omitempty"`
	QualityNote           string        `json:"quality_note,omitempty"`
	Err                   string        `json:"error,omitempty"`
}

type usageObject struct {
	Type              string            `json:"type,omitempty"`
	Seconds           float64           `json:"seconds,omitempty"`
	InputTokens       int               `json:"input_tokens,omitempty"`
	OutputTokens      int               `json:"output_tokens,omitempty"`
	TotalTokens       int               `json:"total_tokens,omitempty"`
	InputTokenDetails inputTokenDetails `json:"input_token_details,omitempty"`
}

type inputTokenDetails struct {
	TextTokens  int `json:"text_tokens,omitempty"`
	AudioTokens int `json:"audio_tokens,omitempty"`
}

func main() {
	var (
		configPath = flag.String("config", "scenarios.example.json", "Path to the scenario JSON file")
		outPath    = flag.String("out", "", "Optional path for JSON results")
		csvPath    = flag.String("csv", "", "Optional path for CSV results")
		timeout    = flag.Duration("timeout", 10*time.Minute, "HTTP timeout per request")
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

	client := &http.Client{Timeout: *timeout}
	results := make([]result, 0, len(scenarios))

	for _, s := range scenarios {
		r := runScenario(context.Background(), client, apiKey, s)
		results = append(results, r)
		printResult(r)
	}

	if *outPath != "" {
		if err := writeResults(*outPath, results); err != nil {
			exitf("write results: %v", err)
		}
		fmt.Printf("\nWrote JSON results to %s\n", *outPath)
	}
	if *csvPath != "" {
		if err := writeCSV(*csvPath, results); err != nil {
			exitf("write csv: %v", err)
		}
		fmt.Printf("Wrote CSV results to %s\n", *csvPath)
	}
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
		if strings.TrimSpace(s.Audio) == "" {
			return nil, fmt.Errorf("scenario[%d]: audio is required", i)
		}
	}

	return scenarios, nil
}

func runScenario(ctx context.Context, client *http.Client, apiKey string, s scenario) result {
	start := time.Now()
	r := result{
		ID:                    s.ID,
		Title:                 s.Title,
		Model:                 s.Model,
		Audio:                 s.Audio,
		Language:              s.Language,
		Notes:                 s.Notes,
		FormattedInputTokens:  s.FormattedInputTokens,
		FormattedOutputTokens: s.FormattedOutputTokens,
		SubjectiveQuality:     s.SubjectiveQuality,
		QualityNote:           s.QualityNote,
	}

	transcript, meta, err := transcribe(ctx, client, apiKey, s)
	r.Elapsed = time.Since(start)
	if err != nil {
		r.Err = err.Error()
		return r
	}

	r.Transcript = transcript
	r.TranscriptCharCount = len([]rune(transcript))
	r.AudioDurationSeconds = meta.durationSeconds
	if meta.durationSeconds > 0 {
		r.AudioDurationMinutes = meta.durationSeconds / 60.0
	}
	r.APIUsageType = meta.usage.Type
	r.APIInputTokens = meta.usage.InputTokens
	r.APIOutputTokens = meta.usage.OutputTokens
	r.APITotalTokens = meta.usage.TotalTokens
	r.APIAudioTokens = meta.usage.InputTokenDetails.AudioTokens
	r.APITextTokens = meta.usage.InputTokenDetails.TextTokens
	r.ActualCostUSD = calculateCostUSD(s.Model, meta.usage, meta.durationSeconds)
	return r
}

type transcriptionMeta struct {
	durationSeconds float64
	usage           usageObject
}

func transcribe(ctx context.Context, client *http.Client, apiKey string, s scenario) (string, transcriptionMeta, error) {
	audioFile, err := os.Open(s.Audio)
	if err != nil {
		return "", transcriptionMeta{}, err
	}
	defer audioFile.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	filePart, err := writer.CreateFormFile("file", filepath.Base(s.Audio))
	if err != nil {
		return "", transcriptionMeta{}, err
	}
	if _, err := io.Copy(filePart, audioFile); err != nil {
		return "", transcriptionMeta{}, err
	}

	if err := writer.WriteField("model", s.Model); err != nil {
		return "", transcriptionMeta{}, err
	}
	if strings.TrimSpace(s.Language) != "" {
		if err := writer.WriteField("language", s.Language); err != nil {
			return "", transcriptionMeta{}, err
		}
	}
	if strings.TrimSpace(s.Prompt) != "" {
		if err := writer.WriteField("prompt", s.Prompt); err != nil {
			return "", transcriptionMeta{}, err
		}
	}
	if err := writer.WriteField("response_format", responseFormatForModel(s.Model)); err != nil {
		return "", transcriptionMeta{}, err
	}
	if err := writer.Close(); err != nil {
		return "", transcriptionMeta{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, &body)
	if err != nil {
		return "", transcriptionMeta{}, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := client.Do(req)
	if err != nil {
		return "", transcriptionMeta{}, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", transcriptionMeta{}, err
	}

	if resp.StatusCode >= 400 {
		var apiErr errorEnvelope
		if err := json.Unmarshal(respBody, &apiErr); err == nil && apiErr.Error.Message != "" {
			return "", transcriptionMeta{}, fmt.Errorf("api error (%d): %s", resp.StatusCode, apiErr.Error.Message)
		}
		return "", transcriptionMeta{}, fmt.Errorf("api error (%d): %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var ok successResponse
	if err := json.Unmarshal(respBody, &ok); err != nil {
		return "", transcriptionMeta{}, fmt.Errorf("decode response: %w", err)
	}
	if ok.Text == "" {
		return "", transcriptionMeta{}, errors.New("empty transcript text in response")
	}

	durationSeconds := ok.Duration
	if durationSeconds == 0 && ok.Usage.Type == "duration" {
		durationSeconds = ok.Usage.Seconds
	}

	return ok.Text, transcriptionMeta{
		durationSeconds: durationSeconds,
		usage:           ok.Usage,
	}, nil
}

func writeResults(path string, results []result) error {
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
		"audio",
		"audio_duration_minutes",
		"transcript_char_count",
		"formatted_input_tokens",
		"formatted_output_tokens",
		"actual_cost_usd",
		"subjective_quality_score",
		"quality_note",
		"api_usage_type",
		"api_input_tokens",
		"api_output_tokens",
		"api_total_tokens",
		"api_audio_tokens",
		"api_text_tokens",
		"elapsed_ms",
		"error",
	}
	if err := w.Write(header); err != nil {
		return err
	}

	for _, r := range results {
		row := []string{
			r.ID,
			r.Title,
			r.Model,
			r.Audio,
			fmt.Sprintf("%.4f", r.AudioDurationMinutes),
			fmt.Sprintf("%d", r.TranscriptCharCount),
			intPtrString(r.FormattedInputTokens),
			intPtrString(r.FormattedOutputTokens),
			fmt.Sprintf("%.6f", r.ActualCostUSD),
			intPtrString(r.SubjectiveQuality),
			r.QualityNote,
			r.APIUsageType,
			zeroOrIntString(r.APIInputTokens),
			zeroOrIntString(r.APIOutputTokens),
			zeroOrIntString(r.APITotalTokens),
			zeroOrIntString(r.APIAudioTokens),
			zeroOrIntString(r.APITextTokens),
			fmt.Sprintf("%d", r.Elapsed.Milliseconds()),
			r.Err,
		}
		if err := w.Write(row); err != nil {
			return err
		}
	}

	return w.Error()
}

func printResult(r result) {
	fmt.Printf("\n[%s] %s\n", r.ID, r.Title)
	fmt.Printf("model=%s audio=%s elapsed=%s\n", r.Model, r.Audio, r.Elapsed.Round(time.Millisecond))
	if r.Language != "" {
		fmt.Printf("language=%s\n", r.Language)
	}
	if r.Notes != "" {
		fmt.Printf("notes=%s\n", r.Notes)
	}
	if r.Err != "" {
		fmt.Printf("error=%s\n", r.Err)
		return
	}
	if r.AudioDurationMinutes > 0 {
		fmt.Printf("audio_duration_minutes=%.4f\n", r.AudioDurationMinutes)
	}
	fmt.Printf("transcript_char_count=%d\n", r.TranscriptCharCount)
	if r.APIUsageType != "" {
		fmt.Printf("api_usage_type=%s input_tokens=%d output_tokens=%d audio_tokens=%d text_tokens=%d\n",
			r.APIUsageType, r.APIInputTokens, r.APIOutputTokens, r.APIAudioTokens, r.APITextTokens)
	}
	if r.ActualCostUSD > 0 {
		fmt.Printf("actual_cost_usd=%.6f\n", r.ActualCostUSD)
	}
	if r.FormattedInputTokens != nil || r.FormattedOutputTokens != nil || r.SubjectiveQuality != nil {
		fmt.Printf("formatted_input_tokens=%s formatted_output_tokens=%s subjective_quality_score=%s\n",
			intPtrString(r.FormattedInputTokens), intPtrString(r.FormattedOutputTokens), intPtrString(r.SubjectiveQuality))
	}
	if r.QualityNote != "" {
		fmt.Printf("quality_note=%s\n", r.QualityNote)
	}
	fmt.Println("transcript:")
	fmt.Println(r.Transcript)
}

func responseFormatForModel(model string) string {
	if model == "whisper-1" {
		return "verbose_json"
	}
	return "json"
}

func calculateCostUSD(model string, usage usageObject, durationSeconds float64) float64 {
	switch model {
	case "whisper-1":
		if durationSeconds == 0 {
			durationSeconds = usage.Seconds
		}
		return (durationSeconds / 60.0) * 0.006
	case "gpt-4o-mini-transcribe":
		audioCost := float64(usage.InputTokenDetails.AudioTokens) * (3.00 / 1_000_000.0)
		textInputCost := float64(usage.InputTokenDetails.TextTokens) * (1.25 / 1_000_000.0)
		textOutputCost := float64(usage.OutputTokens) * (5.00 / 1_000_000.0)
		if audioCost == 0 && textInputCost == 0 && textOutputCost == 0 && durationSeconds > 0 {
			return (durationSeconds / 60.0) * 0.003
		}
		return audioCost + textInputCost + textOutputCost
	default:
		return 0
	}
}

func intPtrString(v *int) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%d", *v)
}

func zeroOrIntString(v int) string {
	if v == 0 {
		return ""
	}
	return fmt.Sprintf("%d", v)
}

func exitf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
