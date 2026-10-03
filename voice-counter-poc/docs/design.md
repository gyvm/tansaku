# 詳細設計

## 1. 全体構成

```
┌──────────────────────── Chrome ────────────────────────┐
│  CallController                                          │
│   ├─ Mic（AudioWorklet: 16kHz PCM, 100ms, RMS）          │
│   │     └─▶ STT エンジン ─────────────wss──────────────┼─▶ Gemini Live API
│   │         （GeminiLiveStt / WebSpeechStt）             │   gemini-3.5-transcribe-live
│   ├─ 簡易 VAD（発話終了時刻の推定・Hybrid VAD）         │
│   ├─ PcmPlayer（24kHz PCM を隙間なく連続再生）          │
│   └─ BrowserSpeaker（speechSynthesis。フォールバック）  │
└────────────┬──────────────────────────▲─────────────────┘
             │ POST /api/stt-token       │ JSON + バイナリ PCM
             │ WS /ws?sid=...            │
┌────────────▼──────────────────────────┴─────────────────┐
│ Cloudflare Worker (index.ts)                             │
│   └─ CallSession Durable Object (session.ts)             │
│        └─ runTurn (pipeline.ts)                          │
│             ├─ Classifier ── Jev /v1/systemone           │
│             ├─ Generator ─── Gemini Interactions (SSE)   │
│             ├─ SpeechChunker                             │
│             └─ Synthesizer ─ Gemini TTS (SSE, L16 24kHz) │
└──────────────────────────────────────────────────────────┘
```

## 2. シーケンス（通常の回答）

```
User      Browser              Gemini STT        Worker/DO              Jev     Gemini LLM   Gemini TTS
 │ 発話 ──▶│── PCM(100ms毎) ──▶│                    │                    │          │            │
 │ 無音    │◀─ interim ────────│                    │                    │          │            │
 │         │◀─ inputTranscription（確定）            │                    │          │            │
 │         │── user_utterance ────────────────────▶│── systemone ──────▶│          │            │
 │         │  （STT を一時停止）                     │◀─ choice/conf ─────│          │            │
 │         │◀─ route ──────────────────────────────│                    │          │            │
 │         │◀─ speech_chunk#0（復唱）               │── 復唱の TTS（キャッシュ）───────────────────▶│
 │         │◀─ PCM#0 ──────────────────────────────│◀──────────────────────────────── audio ─────│
 │◀─ 再生  │                                        │── interactions(stream) ────────▶│            │
 │         │◀─ assistant_delta... ─────────────────│◀─ text delta ───────────────────│            │
 │         │◀─ speech_chunk#1, PCM#1 ...           │── chunk ごとに TTS（並列開始、送信は順番通り）─▶│
 │         │◀─ metrics, turn_end ──────────────────│                    │          │            │
 │         │  （再生終了 + 300ms で STT 再開）       │                    │          │            │
```

- 復唱の TTS と LLM の呼び出しは**並行**して進む。復唱を再生している間に LLM が回答を書き始める。
- clarify（確信度が低い）と out_of_scope（範囲外）は LLM を呼ばず、定型文を 1 チャンクで返す。

## 3. モジュール

### Worker（`worker/src`）

| ファイル | 責務 | 主な設計ポイント |
|---|---|---|
| `index.ts` | ルーティング、STT トークンの発行 | `auth_tokens` をモデルと設定で固定（`liveConnectConstraints`）、使い捨て、30 分で失効 |
| `session.ts` | 通話 1 本 = DO 1 つ | Hibernation API を使う。状態は DO Storage に保存。新しい発話が来たら前のターンを `AbortController` で打ち切る |
| `pipeline.ts` | 1 ターン分の処理 | 依存（判定・生成・合成・時計）を注入してテストしやすくする。読み上げキューで「TTS は並列、送信は順番通り」を実現 |
| `router.ts` | Jev クライアント、モック分類器 | choice 質問 1 つで全トピック + `out_of_scope` を判定。`state` に直前の話題と AI の発話を含める |
| `llm.ts` | Gemini で回答生成 | Interactions API、`stream: true`、`store: false`、`thinking_level: minimal` |
| `tts.ts` | Gemini TTS | stream で L16 / 24kHz の PCM を受け取る。`withCache` で同じ文言の音声を isolate 内にキャッシュ |
| `chunker.ts` | 読み上げ単位への分割 | 最初のチャンクは 12 文字以上なら読点で切る。2 つ目以降は 60 文字以上。120 文字で強制的に切る |
| `sse.ts` | SSE パーサ | チャンク境界をまたぐイベント、CRLF、末尾の改行なしに対応 |
| `protocol.ts` | メッセージの型とバイナリ形式 | web からも import して型を共有する |
| `knowledge/` | ダミーナレッジ | 1 トピック = 1 Markdown。フロントマターに `id / title / category / description / ack / keywords` |

### Web（`web/src`）

| ファイル | 責務 | 主な設計ポイント |
|---|---|---|
| `callController.ts` | 通話全体の状態管理 | React に依存しないクラスにし、UI は `useSyncExternalStore` で購読する |
| `stt/geminiLive.ts` | Gemini Live で STT | `BidiGenerateContentConstrained?access_token=`。切断されたらトークンを取り直して再接続する（セッションは最長 10 分） |
| `stt/webSpeech.ts` | Web Speech API | キー未設定時のフォールバック。止まったら自動で再開する |
| `audio/mic.ts` + `public/pcm-capture-worklet.js` | マイク入力 | 区間平均で 16kHz にダウンサンプルし、100ms ごとに PCM と RMS を送る |
| `audio/player.ts` | PCM の再生 | `nextTime` で隙間なくスケジュールする。奇数バイトは持ち越す |
| `metrics.ts` | レイテンシの算出 | 発話終了→再生開始、STT の確定待ち、P50/P90 |

## 4. メッセージ仕様（`protocol.ts`）

### Client → Server（JSON）

| type | フィールド | 説明 |
|---|---|---|
| `user_utterance` | `turnId`, `text` | STT の確定結果、またはテキスト入力 |
| `reset` | — | 会話履歴を消去する |

### Server → Client（JSON）

| type | 説明 |
|---|---|
| `ready` | 接続直後に送る。`modes`（jev/mock など）と `ttsSampleRate` |
| `route` | 判定結果。`kind`（answer / clarify / out_of_scope）、`confidence`、`candidates` |
| `assistant_delta` | 字幕用のテキスト差分 |
| `speech_chunk` | 読み上げるチャンク。`browserTts: true` ならクライアントの speechSynthesis で読み上げる |
| `metrics` | サーバー側の区間計測（ターン受信からの ms）: `routed / llmFirstToken / firstChunk / ttsFirstByte / done` |
| `turn_end` | ターン終了 |
| `error` | エラー（`turnId` があればそのターンのもの） |

### Server → Client（バイナリ）

```
[turnId: uint32 LE][seq: uint32 LE][PCM 16bit LE mono 24kHz ...]
```

クライアントは現在の `turnId` と一致しないフレームを捨てる（前のターンの残りを再生しないため）。

## 5. 状態管理

| 状態 | 置き場所 | 理由 |
|---|---|---|
| 会話履歴（直近 6 発話）と直前の話題 | DO Storage（`state` キー） | Hibernation で消えないように。`serializeAttachment` は 2KB 制限があり、日本語の履歴には小さい |
| 実行中のターン | DO インスタンスのフィールド | 実行中は DO が起きているので、メモリで足りる |
| TTS のキャッシュ | Worker のモジュールスコープ | isolate が生きている間だけ有効な簡易キャッシュ（最大 100 件） |
| 通話の UI 状態 | `CallController.snapshot` | React の外で管理し、再描画の範囲を絞る |

## 6. 半二重制御（割り込み非対応）

- 送信した瞬間に STT を止める。
- 100ms ごとの `tick()` で「ターンの処理中か、再生中か」を判定する。どちらも終わって 300ms 経ったら STT を再開する。
- Gemini STT は一時停止中に音声を送らない。Web Speech API は `abort()` で止め、再開時に `start()` する。

## 7. VAD と計測

- クライアントの音量 VAD: しきい値は `max(0.015, ノイズフロア × 3)`。有声のチャンクが 2 回（200ms）続いたら発話中とみなす。
- 「発話終了時刻」は最後に有声と判定したチャンクの受信時刻で近似する（±100ms の粒度）。
- Hybrid VAD を ON にすると、600ms の無音で `audioStreamEnd` を送り、サーバー側の無音待ちを省略する。

## 8. エラー処理とフォールバック

| 状況 | 振る舞い |
|---|---|
| API キーが未設定 | 各サービスが自動でモックに切り替わる（`ready.modes` で画面に表示） |
| Jev / LLM / TTS がエラー | `error` を送り、お詫びの文言を `browserTts: true` で読み上げ、`turn_end` を送る |
| 新しい発話で前のターンを打ち切り | 例外を握りつぶし、`turn_end` は送らない（クライアントはすでに新しい `turnId` に移っている） |
| STT が切断された | 画面に通知し、トークンを取り直して自動で再接続する |
| セッションの WS が切断された | 通話を終了し、通知を表示する |

## 9. セキュリティ上の注意

- 本物の API キーは Worker の secrets にだけ置く。ブラウザには使い捨ての ephemeral token だけを渡す。
- `/api/stt-token` には認証がない。公開する場合は Cloudflare Access などで保護する。
- LLM・TTS の呼び出しは `store: false` にして、Gemini 側に会話を保存させない。
