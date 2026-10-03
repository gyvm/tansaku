// サーバーから届く PCM（16bit LE / mono）を隙間なく連続再生する。
export class PcmPlayer {
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private carry: Uint8Array | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly sampleRate: number,
  ) {}

  /** PCM を再生キューに積み、再生開始予定時刻（performance.now 基準）を返す */
  enqueue(pcm: ArrayBuffer): number | null {
    let bytes = new Uint8Array(pcm);
    // ネットワークの区切りでサンプル（2 バイト）が割れた場合に備えて端数を持ち越す
    if (this.carry) {
      const merged = new Uint8Array(this.carry.length + bytes.length);
      merged.set(this.carry);
      merged.set(bytes, this.carry.length);
      bytes = merged;
      this.carry = null;
    }
    if (bytes.length % 2 === 1) {
      this.carry = bytes.slice(-1);
      bytes = bytes.slice(0, -1);
    }
    if (bytes.length === 0) return null;

    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
    const buffer = this.ctx.createBuffer(1, samples.length, this.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 0x8000;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    // 再生が途切れていたら少し先から始める（すぐ始めるとプチッと鳴ることがある）
    const startAt = Math.max(this.nextTime, this.ctx.currentTime + 0.03);
    source.start(startAt);
    this.nextTime = startAt + buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);

    return performance.now() + (startAt - this.ctx.currentTime) * 1000;
  }

  get isPlaying(): boolean {
    return this.ctx.currentTime < this.nextTime;
  }

  stop(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // 既に停止済み
      }
    }
    this.sources.clear();
    this.nextTime = 0;
    this.carry = null;
  }
}

/** ブラウザ標準の音声合成（TTS の API キーが無いとき / エラー時のフォールバック） */
export class BrowserSpeaker {
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    const pick = () => {
      this.voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith("ja")) ?? null;
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
  }

  speak(text: string, onStart?: () => void): void {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if (this.voice) u.voice = this.voice;
    u.rate = 1.1;
    if (onStart) u.onstart = onStart;
    speechSynthesis.speak(u);
  }

  get isSpeaking(): boolean {
    return speechSynthesis.speaking || speechSynthesis.pending;
  }

  stop(): void {
    speechSynthesis.cancel();
  }
}
