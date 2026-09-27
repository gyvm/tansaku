import type { Turn } from "./callController";

export interface TurnLatency {
  /** 発話終了（VAD 推定）→ 最初の音声再生。目標 3000ms 以内 */
  endToEnd?: number;
  /** 発話終了 → STT 確定 */
  stt?: number;
  /** STT 確定 → 最初の音声再生 */
  afterStt?: number;
}

export function latencyOf(turn: Turn): TurnLatency {
  const { speechEnd, sttFinal, firstAudio } = turn.times;
  return {
    endToEnd: firstAudio !== undefined ? firstAudio - speechEnd : undefined,
    stt: turn.source === "voice" ? sttFinal - speechEnd : undefined,
    afterStt: firstAudio !== undefined ? firstAudio - sttFinal : undefined,
  };
}

export function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function fmtMs(ms: number | undefined): string {
  return ms === undefined ? "—" : `${Math.round(ms).toLocaleString()} ms`;
}
