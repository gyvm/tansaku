// Gemini Live API（gemini-3.5-transcribe-live）で STT する。
// ブラウザから Google に直接 WebSocket でつなぐので、音声が Worker を経由しない（低遅延）。
// https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
import type { SttEngine, SttHandlers } from "./types";

const WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

interface TokenResponse {
  mode: "gemini";
  token: string;
  model: string;
  config: { responseModalities: string[]; inputAudioTranscription: Record<string, unknown> };
}

interface LiveServerMessage {
  setupComplete?: unknown;
  serverContent?: {
    interimInputTranscription?: { text?: string };
    inputTranscription?: { text?: string };
  };
  goAway?: unknown;
}

export class GeminiLiveStt implements SttEngine {
  readonly label = "Gemini 3.5 Transcribe Live";
  private ws: WebSocket | null = null;
  private paused = false;
  private stopped = false;

  constructor(
    private readonly fetchToken: () => Promise<TokenResponse>,
    private readonly handlers: SttHandlers,
  ) {}

  async start(): Promise<void> {
    this.stopped = false;
    await this.connect();
  }

  private async connect(): Promise<void> {
    // トークンは 1 回使い切り。再接続のたびに取り直す
    const { token, model, config } = await this.fetchToken();
    const ws = new WebSocket(`${WS_URL}?access_token=${encodeURIComponent(token)}`);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model: `models/${model}`,
              generationConfig: { responseModalities: config.responseModalities },
              inputAudioTranscription: config.inputAudioTranscription,
            },
          }),
        );
      };
      ws.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
        const raw = typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data);
        const msg = JSON.parse(raw) as LiveServerMessage;
        if (msg.setupComplete) {
          resolve();
          return;
        }
        const content = msg.serverContent;
        if (content?.interimInputTranscription?.text) this.handlers.onInterim(content.interimInputTranscription.text);
        if (content?.inputTranscription?.text) this.handlers.onFinal(content.inputTranscription.text);
      };
      ws.onerror = () => reject(new Error("Gemini Live WebSocket error"));
      ws.onclose = (e) => {
        reject(new Error(`Gemini Live closed before setup: ${e.code} ${e.reason}`));
        if (this.ws !== ws || this.stopped) return;
        // セッションは最長 10 分。切れたら自動で張り直す
        this.handlers.onError(`STT 接続が切れました（${e.code} ${e.reason || ""}）。再接続します`);
        this.connect().catch((err: Error) => this.handlers.onError(err.message));
      };
    });
  }

  pushAudio(pcm: Int16Array): void {
    if (this.paused || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: { audio: { data: toBase64(pcm), mimeType: "audio/pcm;rate=16000" } },
      }),
    );
  }

  endOfSpeech(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  stop(): void {
    this.stopped = true;
    this.ws?.close();
    this.ws = null;
  }
}

function toBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
