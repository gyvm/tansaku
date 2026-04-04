# openai-stt-eval

OpenAIの音声文字起こしAPIを使って、Whisper API (`whisper-1`) と `gpt-4o-mini-transcribe` を簡易比較するためのGo製CLIです。検証ごとのコスト記録フォーマットもそのまま出力できます。

## 公式仕様の確認元

- OpenAI Audio API reference: `POST /v1/audio/transcriptions`
- OpenAI Speech-to-Text guide

確認したポイント:

- 利用エンドポイントは `https://api.openai.com/v1/audio/transcriptions`
- 音声入力形式は `flac`, `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `ogg`, `wav`, `webm`
- 利用モデル候補に `whisper-1` と `gpt-4o-mini-transcribe` が含まれる
- `language` に ISO-639-1 を渡すと精度とレイテンシ改善が見込める
- `gpt-4o-mini-transcribe` の `response_format` は `json` のみ
- `gpt-4o-mini-transcribe` の JSON 応答には `usage.input_tokens`, `usage.output_tokens`, `usage.input_token_details.audio_tokens`, `usage.input_token_details.text_tokens` が含まれる
- `whisper-1` の `verbose_json` / duration課金系応答では `usage.seconds` と `duration` が返る

## 使い方

`OPENAI_API_KEY` を設定して実行します。

```bash
cd openai-stt-eval
go run . -config scenarios.example.json -out results.json -csv results.csv
```

絶対パスでの実行例:

```bash
cd /Users/yosuke/GitHub/tansaku/openai-stt-eval
OPENAI_API_KEY=... go run . -config scenarios.example.json -out results.json -csv results.csv
```

特定の音声ファイルに差し替えたい場合は [scenarios.example.json](/Users/yosuke/GitHub/tansaku/openai-stt-eval/scenarios.example.json) を編集してください。

`results.csv` は次の記録列を持ちます。

- `audio_duration_minutes`
- `transcript_char_count`
- `formatted_input_tokens`
- `formatted_output_tokens`
- `actual_cost_usd`
- `subjective_quality_score`

加えて、APIから取得できる監査用の列として `api_input_tokens`, `api_output_tokens`, `api_audio_tokens`, `api_text_tokens` も出力します。

## 記録ルール

- `audio_duration_minutes`: APIレスポンスの `duration` または `usage.seconds` から自動算出
- `transcript_char_count`: 文字起こし結果の文字数
- `actual_cost_usd`: 公式料金表ベースで自動算出
  - `whisper-1`: `$0.006 / minute`
  - `gpt-4o-mini-transcribe`: `audio input $3.00 / 1M`, `text input $1.25 / 1M`, `text output $5.00 / 1M`
- `formatted_input_tokens`, `formatted_output_tokens`, `subjective_quality_score`: 現状は手入力前提です。テンプレートでは `0` を入れてあるので、検証後に埋めてください
- `subjective_quality_score`: 1〜5 を想定

## 想定ユース

以下の6パターンをそのままテンプレート化しています。

1. Whisper API (`whisper-1`) / クリア音声・1人 / 日本語
2. Whisper API (`whisper-1`) / 複数人・会議室 / 日本語
3. Whisper API (`whisper-1`) / Zoom録音 / 日本語
4. `gpt-4o-mini-transcribe` / クリア音声・1人 / 日本語
5. `gpt-4o-mini-transcribe` / 複数人・会議室 / 日本語
6. Whisper API (`whisper-1`) / クリア音声 / 日英混在

## 注意

- このCLIは簡易検証用です。正解文との自動WER比較までは入れていません。
- 音声ファイルはリポジトリに含めていないため、`samples/` 配下へ手元の音声を置いてください。
- 検証は `go test ./...` まで確認済みです。実APIコールは音声ファイルと `OPENAI_API_KEY` が必要なため、README更新時点では未実行です。

## 一次情報

- OpenAI Audio API reference: https://platform.openai.com/docs/api-reference/audio/createTranscription
- OpenAI Pricing: https://platform.openai.com/docs/pricing/
- OpenAI Whisper model: https://platform.openai.com/docs/models/whisper-1
- OpenAI GPT-4o Mini Transcribe model: https://platform.openai.com/docs/models/gpt-4o-mini-transcribe
