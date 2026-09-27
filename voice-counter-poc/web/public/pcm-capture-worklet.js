// マイク入力を 16kHz / 16bit PCM（Gemini Live API の入力形式）に変換し、
// 100ms ごとにメインスレッドへ送る AudioWorklet。音量（RMS）も一緒に送って VAD に使う。
const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 1600; // 100ms

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE; // sampleRate は AudioWorkletGlobalScope のグローバル
    this.chunk = new Int16Array(CHUNK_SAMPLES);
    this.length = 0;
    this.acc = 0;
    this.count = 0;
    this.phase = 0;
    this.sumSq = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      // 区間平均による簡易ダウンサンプリング（音声認識用途には十分）
      this.acc += input[i];
      this.count++;
      this.phase += 1;
      if (this.phase < this.ratio) continue;
      this.phase -= this.ratio;

      const v = Math.max(-1, Math.min(1, this.acc / this.count));
      this.acc = 0;
      this.count = 0;
      this.chunk[this.length++] = v < 0 ? v * 0x8000 : v * 0x7fff;
      this.sumSq += v * v;

      if (this.length === CHUNK_SAMPLES) {
        const rms = Math.sqrt(this.sumSq / CHUNK_SAMPLES);
        this.port.postMessage({ pcm: this.chunk.buffer, rms }, [this.chunk.buffer]);
        this.chunk = new Int16Array(CHUNK_SAMPLES);
        this.length = 0;
        this.sumSq = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
