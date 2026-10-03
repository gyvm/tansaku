# 音声窓口 PoC（リアルタイム音声対話）

自治体窓口やコールセンターの自動応答を想定したプロトタイプです。
ユーザーが声で質問すると、Jev で問い合わせ内容を判定し、関連するナレッジをもとに回答を音声で返します。

- 目標: **ユーザーの発話終了から 3 秒以内に音声での返答を始める**
- 対象ブラウザ: Chrome（PC）
- ナレッジ: 架空の「サンプル市」のダミーデータ（`worker/src/knowledge/*.md`）

## 構成

```
 Chrome ──(マイク PCM 16kHz)──▶ Gemini Live API  gemini-3.5-transcribe-live（STT）
   │  ▲                             │ 確定テキスト
   │  │                             ▼
   │  └──(PCM 24kHz / テキスト)── Cloudflare Worker + Durable Object（1 通話 = 1 DO）
   │                                 ├─▶ Jev（TypeSafe AI）  意図判定: どの手続きの質問か
   │                                 ├─▶ Gemini 3.5 Flash-Lite  回答文をストリーミング生成
   │                                 └─▶ Gemini 3.8 Flash-Lite TTS  音声をストリーミング合成
   └── POST /api/stt-token（STT 用の使い捨てトークンを発行）
```

| 役割 | 使っているもの | キー未設定時 |
|---|---|---|
| STT | Gemini Live API `gemini-3.5-transcribe-live`（ブラウザから直接接続） | Chrome の Web Speech API |
| 意図判定 | Jev `jev-latest`（choice 質問） | キーワード一致のモック |
| 回答生成 | Gemini `gemini-3.5-flash-lite`（Interactions API, stream） | ナレッジを読み上げるモック |
| 音声合成 | Gemini `gemini-3.8-flash-lite-tts`（stream, PCM 24kHz） | ブラウザの speechSynthesis |

モデル名や声、ルーティングのしきい値は `worker/wrangler.jsonc` の `vars` で変更できます。

### 3 秒以内を狙うための工夫

1. **STT はブラウザから Google に直接接続**します。音声が Worker を経由しないので、そのぶん遅延が減ります。API キーはブラウザに渡さず、Worker がモデルと設定を固定した使い捨てトークン（ephemeral token）を発行します。
2. **Jev の判定直後に「〜についてですね。」と復唱**します。LLM の回答を待たずに声が出るので、体感の待ち時間が短くなります。同じ文言の音声はキャッシュするため、2 回目以降は TTS の待ち時間もかかりません。
3. **LLM の出力を細かく区切って TTS に流します**（`worker/src/chunker.ts`）。最初のチャンクは読点でも切り、2 つ目以降は句点まで待ちます。各チャンクの TTS は並列で始め、送信だけ順番を守ります。
4. **範囲外の質問や、判定の確信度が低いときは LLM を呼びません**。範囲外なら「担当課に確認のうえ改めて連絡する／ホームページを案内する」定型文を、確信度が低ければ候補 2 つからの聞き返しを返します。
5. **音声はバイナリフレームで送ります**。JSON + base64 だとデータが 33% 増えるためです。

### 対話の仕様

- **半二重**: AI が話している間は STT を止めます。割り込み（barge-in）には対応していません。エコー対策も兼ねるので、ヘッドセットの利用を推奨します。
- **追加質問**: 「それって何が必要？」のような質問に答えるため、直前の話題と AI の発話を Jev の `state` に含めています。
- **会話履歴**: DO Storage に直近 6 発話を保存し、LLM に渡します。

## セットアップ

```bash
cd voice-counter-poc
npm install
cp worker/.dev.vars.example worker/.dev.vars   # API キーを記入（空欄ならモックで動く）
npm run dev                                     # wrangler dev(:8787) と vite(:5173) を同時に起動
```

Chrome で http://localhost:5173 を開き、「通話を開始」を押してマイクを許可します。
下部の入力欄からテキストでも質問できるので、マイクを使わずにパイプラインを確認できます。

| 環境変数（`worker/.dev.vars`） | 取得先 |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey)（STT / LLM / TTS 共通） |
| `JEV_API_KEY` | [TypeSafe AI](https://docs.typesafe.ai/) |

### その他のコマンド

```bash
npm test            # worker のユニットテスト（vitest）
npm run typecheck   # worker / web の型チェック
npm run deploy      # web をビルドして Cloudflare にデプロイ（事前に wrangler login と secret 設定）
npx -w worker wrangler secret put GEMINI_API_KEY
npx -w worker wrangler secret put JEV_API_KEY
```

> ⚠️ `/api/stt-token` には認証をかけていません。公開 URL にデプロイする場合は Cloudflare Access などで保護してください。トークンを発行するたびに API 利用料が発生します。

## 計測

画面には 1 ターンごとに次の値を表示し、上部には「発話終了→応答開始」の P50/P90 を表示します。

| 表示 | 意味 |
|---|---|
| 発話終了→応答開始 | クライアントの音量 VAD で最後に声を検知した時刻から、最初の音声の再生開始まで（**目標 3000ms**） |
| STT 確定待ち | 発話終了から STT の確定結果が届くまで |
| Jev / LLM 初トークン / TTS 初バイト | サーバーがターンを受け取ってからの経過時間 |

STT の確定待ちが長い場合は、画面の「Hybrid VAD」を ON にしてください。クライアント側で 600ms の無音を検知した時点で `audioStreamEnd` を送り、サーバー側の無音待ちを省略します（[公式ドキュメント](https://ai.google.dev/gemini-api/docs/live-api/live-transcribe)）。

## ナレッジの追加

`worker/src/knowledge/` に Markdown を追加し、`index.ts` の配列に 1 行足します。
フロントマターの各項目は次のように使われます。

- `description`: Jev の選択肢の説明になります。判定精度に直結するので、どんな質問がここに該当するかを具体的に書きます。
- `ack`: 判定直後に読み上げる復唱フレーズです。
- `keywords`: STT のカスタム語彙（認識の補正）と、モック分類器に使います。

Jev の choice の選択肢は最大 255 個です。市役所サイト全体のように、それを超える規模になった場合は「カテゴリ判定 → カテゴリ内のトピック判定」の 2 段階にするか、トピック判定の後に全文検索やベクトル検索で文書を絞り込む構成に拡張してください。

## ドキュメント

設計や判断の経緯は [`docs/`](./docs/README.md) にまとめています。

- [architecture-review.md](./docs/architecture-review.md): 実装前のアーキテクチャレビューと質疑
- [design.md](./docs/design.md): 詳細設計（シーケンス、メッセージ仕様、状態管理）
- [decisions.md](./docs/decisions.md): 設計判断の記録（自走で決めた事項を含む）
- [session-log.md](./docs/session-log.md): 開発セッションのログと、未検証の事項

## ディレクトリ

```
worker/                 Cloudflare Worker + Durable Object
  src/index.ts          ルーティング、STT トークン発行
  src/session.ts        CallSession（DO）: WebSocket・会話状態
  src/pipeline.ts       1 ターンの処理（判定 → 復唱 → LLM → TTS）
  src/router.ts         Jev クライアント / モック分類器
  src/llm.ts, tts.ts    Gemini クライアント（SSE ストリーミング）
  src/chunker.ts        読み上げ単位への分割
  src/protocol.ts       ブラウザとのメッセージ定義（web からも import）
  src/knowledge/        ダミーナレッジ
web/                    Vite + React
  src/callController.ts 通話制御（STT・VAD・再生・計測）
  src/stt/              Gemini Live / Web Speech API
  src/audio/            マイク取り込み（AudioWorklet）・PCM 再生
  public/pcm-capture-worklet.js
```

## 現状と次のステップ

- [x] Phase 1: テキストでの対話パイプライン、計測の組み込み、モックでの一連の動作確認
- [x] Phase 2: 音声入出力、復唱、チャンク分割 TTS（実装済み。**実際の API キーを使った確認はまだ**）
- [ ] 実キーで確認する: Jev / Gemini の実レスポンス形式、日本語の音声品質、レイテンシの実測
- [ ] 想定質問 20〜30 件で Jev のルーティング精度を評価する
- [ ] Phase 3（必要に応じて）: 割り込み対応、Jev の 2 段階判定、サーバー側 STT（電話接続を見据えて）
