// LLM のストリーミング出力を「TTS に渡す単位」に切り分ける。
//
// 3 秒以内に返答を始めるには、LLM が文を書き終わるのを待たずに TTS を始めたい。
// 一方で細かく切りすぎると音声のイントネーションが不自然になる。
// そこで「最初のチャンクだけ短め（読点でも切る）、2 つ目以降は句点まで待つ」方針にする。

export interface ChunkerOptions {
  /** 最初のチャンクを読点で切ってよい最小文字数 */
  firstMinChars: number;
  /** 2 つ目以降のチャンクを読点で切ってよい最小文字数 */
  restMinChars: number;
  /** 句読点が来なくても強制的に切る文字数 */
  maxChars: number;
}

export const DEFAULT_CHUNKER_OPTIONS: ChunkerOptions = {
  firstMinChars: 12,
  restMinChars: 60,
  maxChars: 120,
};

const SENTENCE_END = /[。！？!?\n]/;
const CLAUSE_END = /[、，,]/;

export class SpeechChunker {
  private buffer = "";
  private emitted = 0;

  constructor(private readonly options: ChunkerOptions = DEFAULT_CHUNKER_OPTIONS) {}

  /** テキスト差分を追加し、確定したチャンクを返す */
  push(delta: string): string[] {
    this.buffer += delta;
    const out: string[] = [];
    let chunk: string | null;
    while ((chunk = this.take()) !== null) out.push(chunk);
    return out;
  }

  /** ストリーム終了時に残りを吐き出す */
  flush(): string[] {
    const rest = cleanForSpeech(this.buffer);
    this.buffer = "";
    return rest ? [rest] : [];
  }

  private take(): string | null {
    const minChars = this.emitted === 0 ? this.options.firstMinChars : this.options.restMinChars;
    let cut = -1;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (SENTENCE_END.test(ch)) {
        cut = i + 1;
        break;
      }
      if (CLAUSE_END.test(ch) && i + 1 >= minChars) {
        cut = i + 1;
        break;
      }
      if (i + 1 >= this.options.maxChars) {
        cut = i + 1;
        break;
      }
    }
    if (cut < 0) return null;

    const raw = this.buffer.slice(0, cut);
    this.buffer = this.buffer.slice(cut);
    const text = cleanForSpeech(raw);
    if (!text) return this.take();
    this.emitted++;
    return text;
  }
}

/** 読み上げに不要なマークダウン記号などを落とす（LLM には使うなと指示しているが念のため） */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/[*#`_>|]/g, "")
    .replace(/^\s*[-・]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
