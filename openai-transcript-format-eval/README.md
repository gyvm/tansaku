# openai-transcript-format-eval

OpenAI Responses API を使って、文字起こし後の「整形」単体を比較検証する Go 製 CLI です。  
Phase 2 の以下 6 パターンをそのまま実行できるようにしています。

1. Whisper 生テキスト + `gpt-4o-mini` ゼロショット
2. Whisper 生テキスト + `gpt-4o-mini` 数ショット
3. Whisper 生テキスト + `gpt-4o` ゼロショット
4. Whisper 生テキスト + `gpt-4o-mini` 話者分離プロンプト
5. Zoom 文字起こし貼り付け + `gpt-4o-mini` ゼロショット
6. Google Meet 文字起こし貼り付け + `gpt-4o-mini` ゼロショット

## 何が検証できるか

- 整形前テキストのソース違いによる扱いやすさ
- ゼロショット vs 数ショットの品質差
- `gpt-4o-mini` vs `gpt-4o` の品質差
- 話者ラベル付与プロンプトの効き方
- 各パターンの `input_tokens` / `output_tokens` / `total_tokens`
- モデル価格に基づく概算コスト
- 人手評価用の CSV / Markdown レポート出力

## 公式ドキュメントの確認元

2026-04-05 時点で以下の一次情報を確認して実装しています。

- OpenAI Text generation guide: Responses API を新規実装の推奨 API として案内  
  https://platform.openai.com/docs/guides/chat-completions
- OpenAI Responses API reference: `POST /v1/responses`  
  https://platform.openai.com/docs/api-reference/responses
- OpenAI Structured outputs guide: JSON 形式出力の考え方  
  https://platform.openai.com/docs/guides/structured-outputs
- OpenAI Pricing page: `gpt-4o-mini` / `gpt-4o` の単価確認  
  https://openai.com/api/pricing

この CLI は依存を減らすため Go 標準ライブラリの `net/http` で `POST /v1/responses` を呼び、モデルには JSON のみを返すよう指示しています。

## セットアップ

```bash
cd openai-transcript-format-eval
mise install
```

`OPENAI_API_KEY` を設定して実行します。

```bash
export OPENAI_API_KEY=...
go run . \
  -config scenarios.example.json \
  -scenario 07 \
  -out results.json \
  -csv metrics.csv \
  -report report.md
```

全件流す場合は `-scenario` を外してください。

## 出力物

- `results.json`: シナリオごとの生結果
- `metrics.csv`: シミュレーター投入向けの集計列
- `report.md`: 人がレビューしやすい比較レポート

`metrics.csv` には以下の列が入ります。

- `audio_length_minutes`
- `input_characters`
- `input_tokens`
- `output_tokens`
- `total_tokens`
- `cost_usd`
- `manual_quality_score`

`manual_quality_score` は空欄のまま出力するので、人手で 1〜5 を追記してください。

## デモデータ

`samples/` に 30 分 MTG 相当のデモ入力を 3 種類同梱しています。

- `meeting_30min_whisper_raw.txt`
- `meeting_30min_zoom_transcript.txt`
- `meeting_30min_google_meet_transcript.txt`

同一ミーティング内容を、Whisper 風の生テキスト、Zoom 風文字起こし、Google Meet 風文字起こしとして崩してあります。

## 注意

- 主観品質スコアは自動では判定していません。
- コストはシナリオ定義の単価、または内蔵デフォルト単価から計算する概算です。価格改定があった場合は `scenarios.example.json` を更新してください。
- モデル出力が JSON 以外を返した場合は `results.json` と `report.md` に生出力を残します。
