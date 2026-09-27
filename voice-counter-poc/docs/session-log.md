# セッションログ

Claude Code（クラウドセッション）で開発したときの作業記録です。

- 日付: 2026-09-27
- ブランチ: `claude/realtime-voice-dialogue-architecture-n4m5hm`
- 対象: `gyvm/tansaku` の `voice-counter-poc/`

---

## 1. 依頼（1 回目）: 実装前のアーキテクチャレビュー

**依頼内容**: コールセンターや自治体窓口向けのリアルタイム音声対話 PoC について、実装前に次の 4 点を求められた。

1. 3 秒以内に返答を始められるかのボトルネック分析
2. Cloudflare Workers / Durable Objects の制約
3. 事前に決めておくべきことに関する質問
4. マイルストーン案

**やったこと**

- リポジトリを確認した。個人の実験プロジェクト集で、関連する既存コードは無かった。
- Jev（TypeSafe AI）の実在と概要を Web 検索で確認した。分類に特化した「System One」モデルで、choice / confidence を返す。
- レビューを回答した。コードは書いていない。内容は [architecture-review.md](./architecture-review.md) にまとめた。

## 2. 依頼者の回答（2 回目）

- Chrome だけで十分
- STT は Google の最新の AI STT を使いたい。PoC はダミーデータで行う
- 将来はサーバー側 STT にしたいが、まずは最小コストで自動音声を実現できるか確認したい。ブラウザで処理してよい
- 音声の受け取り（TTS）は Google の AI で
- 割り込みには、まずは対応しなくてよい
- ナレッジは市役所サイト程度と膨大。Jev で詳細に判別して関連文書を渡したい。PoC では簡単なダミーでよい
- 範囲外の質問には「確認のうえ再度連絡」またはウェブサイトへの誘導
- Vite + React でシンプルに。配置場所は `voice-counter-poc/`

## 3. 調査（2026-09 時点の公式ドキュメント）

| 対象 | 確認したこと | 出典 |
|---|---|---|
| Google の最新 STT | `gemini-3.5-transcribe-live`（Live API）。16kHz PCM を 100ms ごとに送る。`interimInputTranscription` / `inputTranscription` を返す。`customVocabulary`、Hybrid VAD、`ja-JP` に対応。セッションは最長 10 分 | https://ai.google.dev/gemini-api/docs/live-api/live-transcribe |
| （比較）Chirp 3 | Speech-to-Text V2 で GA。ブラウザから直接つなぐ手段が無いので不採用 | https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3 |
| Ephemeral token | `POST v1beta/auth_tokens`。`liveConnectConstraints` でモデルと設定を固定できる。`BidiGenerateContentConstrained?access_token=` で接続する | https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens, https://ai.google.dev/api/live |
| Gemini TTS | `gemini-3.8-flash-tts` / `gemini-3.8-flash-lite-tts`。Interactions API で `stream: true` にすると L16 24kHz の PCM が返る。日本語に対応 | https://ai.google.dev/gemini-api/docs/speech-generation |
| Gemini テキスト生成 | Interactions API（`/v1beta/interactions`）。SSE の `step.delta` で `delta.type == "text"` が届く | https://ai.google.dev/gemini-api/docs/text-generation, https://ai.google.dev/gemini-api/docs/streaming |
| Jev API | `POST https://api.typesafe.ai/v1/systemone`。質問は `noul / choice / score`。choice は最大 255 選択肢。応答に `choice / probabilities / confidence` | https://docs.typesafe.ai/api |

## 4. 実装の流れ

| 順番 | 作業 | 成果物 |
|---|---|---|
| 1 | npm workspaces（worker / web）を作成し、依存をインストール | `package.json` ×3、`package-lock.json` |
| 2 | ブラウザ ⇄ DO のメッセージ型と、バイナリ音声フレームの定義 | `worker/src/protocol.ts` |
| 3 | ダミーナレッジ 12 トピック（架空の「サンプル市」）とローダ | `worker/src/knowledge/` |
| 4 | SSE パーサ、読み上げ分割、先読みユーティリティ | `sse.ts`, `chunker.ts`, `async.ts` |
| 5 | Jev クライアントとモック分類器、Gemini の LLM / TTS クライアント | `router.ts`, `llm.ts`, `tts.ts` |
| 6 | 1 ターン分のパイプライン（復唱 → LLM → チャンク TTS、聞き返し、範囲外、エラー） | `pipeline.ts` |
| 7 | Durable Object（Hibernation、DO Storage）、Worker のルーティング、STT トークン発行 | `session.ts`, `index.ts`, `wrangler.jsonc` |
| 8 | ユニットテスト | `worker/test/*.test.ts` |
| 9 | Web: AudioWorklet、PCM 再生、Gemini Live / Web Speech の STT、通話制御、UI | `web/` 一式 |
| 10 | README とルートの README へのリンク | `README.md` |

## 5. 検証と、見つけて直した不具合

### ユニットテスト（vitest）

最初の実行では 22 件中 2 件が失敗した。

1. **SSE パーサのバグ**: ストリームが改行で終わらないと、最後のイベントを取りこぼしていた。
   → 行の処理を `handleLine` に切り出し、終了時に残りのバッファを処理するように修正。
2. **テストケースの誤り**: モック分類器の「追加質問」のテストで使った発話「土曜日」が、別トピック（窓口案内）のキーワードに一致していた。
   → 発話を変更。

### モックでの E2E（`wrangler dev` + Vite プロキシ + Node の WebSocket クライアント）

さらに 2 つの問題が見つかった。

3. **モック分類器が「今日の天気」を範囲外にしない**: 前の話題がある状態でキーワードに一致しない発話が来ると、すべて追加質問として扱っていたため。
   → 指示語（それ、その、この など）を含む場合だけ追加質問とみなすように修正し、テストを追加。
4. **「引っ越し」が転入・転出・転居のどれにも一致しない**: キーワードが「引越し」表記になっていたため。
   → 3 トピックに「引っ越し」を追加。3 件が同じスコアになるので、聞き返しになることを確認し、テストを追加。
5. **聞き返しの文言が括弧書きごと読み上げられる**:「転入届（他の市区町村からの引っ越し）」のようになっていた。
   → 読み上げ用に括弧書きを除去し、「転入届と転出届の、どちらについてのご質問でしょうか」にした。

修正後の E2E の結果（モック）:

| 発話 | 判定 | 応答 |
|---|---|---|
| 住民票はコンビニで取れますか | answer / 住民票の写しの交付 | 復唱 → 回答（全体 約 0.73 秒。うち 0.3 秒はモックの人工的な遅延） |
| それって手数料はいくらですか | answer / 住民票（直前の話題を引き継ぐ） | 復唱 → 回答 |
| 今日の天気はどうですか | out_of_scope | 範囲外の定型文（4ms） |
| 引っ越しの手続きを知りたい | clarify / 転入 33%・転出 33% | 聞き返し（4ms） |

### UI（Playwright + ヘッドレス Chromium、偽マイク）

- 「通話を開始」→「お話しください」に遷移し、テキストで 3 問を送信して、会話ログ・判定の表示・計測欄を確認した。
- ヘッドレス環境には読み上げの音声が無いので、「発話終了→応答開始」は「—」になる。これは想定どおり。

### 最終状態

- `npm test`: 24 件すべて通過
- `npm run typecheck`（worker / web）: 通過
- `vite build`: 成功

## 6. 検証できていないこと（要フォロー）

API キーが無いため、次の項目は**実際の API では試していません**。リクエストの形式は公式ドキュメントどおりに実装しています。

- [ ] Jev `/v1/systemone` の実際のレスポンス（`answers.topic.choice / probabilities / confidence`）
- [ ] Gemini Interactions API（LLM）の `thinking_level: "minimal"` が `gemini-3.5-flash-lite` で受け付けられるか
- [ ] Gemini TTS の `response_format.mime_type: "audio/l16"` と `sample_rate`、日本語の読み上げ品質
- [ ] Ephemeral token の `liveConnectConstraints` と、クライアントの `setup` メッセージが整合するか
- [ ] Gemini Live の確定結果（`inputTranscription`）が、1 発話につき 1 回届くか（分割されて届く場合は結合処理が必要）
- [ ] Hybrid VAD（`audioStreamEnd`）を送った後も、同じセッションで認識を続けられるか
- [ ] 実環境でのレイテンシ（目標: 発話終了→応答開始 ≤ 3000ms）

## 7. コミット

| コミット | 内容 |
|---|---|
| `020aae4` | voice-counter-poc 本体（Worker、Web、テスト、ダミーナレッジ、README） |
| （このコミット） | 設計ドキュメント、判断記録（ADR）、レビュー記録、このセッションログ |
