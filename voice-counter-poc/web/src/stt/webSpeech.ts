// Chrome 標準の Web Speech API による STT（GEMINI_API_KEY 未設定時のフォールバック）。
import type { SttEngine, SttHandlers } from "./types";

// Web Speech API の型は TypeScript 標準の DOM 型に含まれないため最小限を定義する
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

export class WebSpeechStt implements SttEngine {
  readonly label = "Web Speech API（Chrome 標準）";
  private recognition: Recognition | null = null;
  private running = false;
  private paused = false;

  constructor(private readonly handlers: SttHandlers) {}

  async start(): Promise<void> {
    const Ctor = (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!Ctor) throw new Error("このブラウザは Web Speech API に対応していません（Chrome を使ってください）");
    const r = new Ctor();
    r.lang = "ja-JP";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) this.handlers.onFinal(res[0].transcript);
        else interim += res[0].transcript;
      }
      if (interim) this.handlers.onInterim(interim);
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") this.handlers.onError(`Web Speech API: ${e.error}`);
    };
    // 無音が続くと勝手に終了するので、使用中なら再開する
    r.onend = () => {
      if (this.running && !this.paused) this.safeStart();
    };
    this.recognition = r;
    this.running = true;
    this.safeStart();
  }

  private safeStart() {
    try {
      this.recognition?.start();
    } catch {
      // すでに開始済み
    }
  }

  pushAudio(): void {}
  endOfSpeech(): void {}

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.recognition?.abort();
    else if (this.running) this.safeStart();
  }

  stop(): void {
    this.running = false;
    this.recognition?.abort();
    this.recognition = null;
  }
}
