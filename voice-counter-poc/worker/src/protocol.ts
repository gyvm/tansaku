// ブラウザ ⇄ Durable Object 間の WebSocket メッセージ定義。
// web 側からも相対パスで import して共有する（型だけなので実行時の依存は無い）。

/** ルーティング結果の種類 */
export type RouteKind = "answer" | "clarify" | "out_of_scope";

/** どの外部サービスを実際に使っているか（API キー未設定ならモックに落ちる） */
export interface ServiceModes {
  router: "jev" | "mock";
  llm: "gemini" | "mock";
  tts: "gemini" | "browser";
}

export type ClientMessage =
  /** STT で確定した（またはテキスト入力された）ユーザー発話 */
  | { type: "user_utterance"; turnId: number; text: string }
  /** 会話履歴をリセット */
  | { type: "reset" };

export type ServerMessage =
  | { type: "ready"; modes: ServiceModes; ttsSampleRate: number }
  | {
      type: "route";
      turnId: number;
      kind: RouteKind;
      topicId: string | null;
      topicTitle: string | null;
      confidence: number;
      /** clarify のときに聞き返す候補 */
      candidates?: { topicId: string; title: string; probability: number }[];
    }
  /** LLM のテキスト差分（字幕表示用） */
  | { type: "assistant_delta"; turnId: number; text: string }
  /**
   * これから読み上げる 1 チャンク分のテキスト。
   * tts=gemini の場合は直後にこの seq のバイナリ音声フレームが続く。
   * browserTts=true の場合（tts=browser やエラー時）はクライアントが speechSynthesis で読み上げる。
   */
  | { type: "speech_chunk"; turnId: number; seq: number; text: string; browserTts?: boolean }
  /** サーバー側の区間計測（turn 受信時刻からの経過 ms） */
  | { type: "metrics"; turnId: number; marks: Partial<Record<ServerMark, number>> }
  | { type: "turn_end"; turnId: number }
  | { type: "error"; turnId?: number; message: string };

export type ServerMark =
  | "routed" // Jev の判定完了
  | "llmFirstToken" // LLM 最初のトークン
  | "firstChunk" // 最初の読み上げチャンク確定
  | "ttsFirstByte" // TTS 最初の音声バイト（= クライアントへ送信開始）
  | "done";

/**
 * バイナリフレーム: [turnId: uint32 LE][seq: uint32 LE][PCM16 LE mono ...]
 * JSON + base64 だと 33% 膨らむためバイナリで送る。
 */
export const AUDIO_HEADER_BYTES = 8;

export function encodeAudioFrame(turnId: number, seq: number, pcm: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(AUDIO_HEADER_BYTES + pcm.byteLength);
  const view = new DataView(buf);
  view.setUint32(0, turnId, true);
  view.setUint32(4, seq, true);
  new Uint8Array(buf, AUDIO_HEADER_BYTES).set(pcm);
  return buf;
}

export function decodeAudioFrame(buf: ArrayBuffer): { turnId: number; seq: number; pcm: ArrayBuffer } {
  const view = new DataView(buf);
  return {
    turnId: view.getUint32(0, true),
    seq: view.getUint32(4, true),
    pcm: buf.slice(AUDIO_HEADER_BYTES),
  };
}
