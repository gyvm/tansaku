export interface SttHandlers {
  /** 話している途中の暫定結果（字幕表示用） */
  onInterim(text: string): void;
  /** 確定した発話 → これをサーバーに送る */
  onFinal(text: string): void;
  onError(message: string): void;
}

export interface SttEngine {
  readonly label: string;
  start(): Promise<void>;
  /** 16kHz PCM を渡す（Web Speech API は自前でマイクを使うので無視する） */
  pushAudio(pcm: Int16Array): void;
  /** クライアント側 VAD で発話終了を検知したときに呼ぶ（Hybrid VAD） */
  endOfSpeech(): void;
  /** AI が話している間は認識を止める（割り込み非対応・エコー対策） */
  setPaused(paused: boolean): void;
  stop(): void;
}
