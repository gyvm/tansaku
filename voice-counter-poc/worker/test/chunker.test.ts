import { describe, expect, it } from "vitest";
import { cleanForSpeech, SpeechChunker } from "../src/chunker";

describe("SpeechChunker", () => {
  it("最初のチャンクは読点でも早めに切る", () => {
    const c = new SpeechChunker();
    expect(c.push("窓口は市役所本庁舎の一階、")).toEqual(["窓口は市役所本庁舎の一階、"]);
  });

  it("短すぎる読点では切らない", () => {
    const c = new SpeechChunker();
    expect(c.push("はい、")).toEqual([]);
    expect(c.push("そうです。")).toEqual(["はい、そうです。"]);
  });

  it("2 つ目以降は句点まで待つ", () => {
    const c = new SpeechChunker();
    expect(c.push("必要なものは本人確認書類です。手数料は、")).toEqual(["必要なものは本人確認書類です。"]);
    expect(c.push("1通300円です。")).toEqual(["手数料は、1通300円です。"]);
  });

  it("ストリームの区切りに関係なく同じ結果になる", () => {
    const text = "転入届は14日以内に出してください。転出証明書と本人確認書類が必要です。";
    const whole = new SpeechChunker();
    const expected = [...whole.push(text), ...whole.flush()];
    const split = new SpeechChunker();
    const actual = [...text].flatMap((ch) => split.push(ch)).concat(split.flush());
    expect(actual).toEqual(expected);
    expect(actual.join("")).toBe(text);
  });

  it("flush で残りを出す", () => {
    const c = new SpeechChunker();
    c.push("以上です");
    expect(c.flush()).toEqual(["以上です"]);
    expect(c.flush()).toEqual([]);
  });

  it("句読点が無くても maxChars で切る", () => {
    const c = new SpeechChunker({ firstMinChars: 12, restMinChars: 60, maxChars: 10 });
    expect(c.push("あいうえおかきくけこさしす")).toEqual(["あいうえおかきくけこ"]);
  });
});

describe("cleanForSpeech", () => {
  it("マークダウン記号を除く", () => {
    expect(cleanForSpeech("- **手数料**は300円")).toBe("手数料は300円");
  });
});
