// 回答生成。Gemini Interactions API をストリーミングで呼び、テキスト差分を yield する。
// https://ai.google.dev/gemini-api/docs/text-generation#streaming-responses

import { sleep } from "./async";
import type { Topic } from "./knowledge";
import { parseSse } from "./sse";

export interface HistoryEntry {
  role: "user" | "assistant";
  text: string;
}

export interface GenerateInput {
  utterance: string;
  topic: Topic;
  history: HistoryEntry[];
}

export type Generator = (input: GenerateInput, signal?: AbortSignal) => AsyncIterable<string>;

export const SYSTEM_INSTRUCTION = [
  "あなたはサンプル市役所の電話自動応答の担当者です。",
  "【参照情報】だけを根拠に、電話口で読み上げられる前提で回答してください。",
  "- 話し言葉で、2〜3文、全体で120文字程度に収める。",
  "- 箇条書き、記号、URL、マークダウンは使わない。数字は読み間違えにくい書き方にする。",
  "- 冒頭の復唱（「〜についてですね」）は直前に済んでいるので繰り返さず、すぐ本題に入る。",
  "- 参照情報に無いことは推測で答えず、「担当課に確認のうえ、改めてご連絡します」と伝える。",
  "- 最後に「ほかにご不明な点はありますか。」のような確認は不要。",
].join("\n");

export function buildPrompt(input: GenerateInput): string {
  const history = input.history
    .slice(-4)
    .map((h) => `${h.role === "user" ? "市民" : "担当者"}: ${h.text}`)
    .join("\n");
  return [
    `【参照情報: ${input.topic.title}】`,
    input.topic.body,
    "",
    history ? `【これまでの会話】\n${history}\n` : "",
    `【今回のご質問】\n${input.utterance}`,
  ].join("\n");
}

export function createGeminiGenerator(apiKey: string, model: string, thinkingLevel: string): Generator {
  return async function* (input, signal) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system_instruction: SYSTEM_INSTRUCTION,
        input: buildPrompt(input),
        generation_config: {
          thinking_level: thinkingLevel,
          temperature: 0.3,
          max_output_tokens: 400,
        },
        stream: true,
        store: false,
      }),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Gemini LLM error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    for await (const ev of parseSse(res.body)) {
      if (ev.data === "[DONE]") break;
      const data = JSON.parse(ev.data) as {
        event_type?: string;
        delta?: { type?: string; text?: string };
        error?: { message?: string };
      };
      if (data.event_type === "error" || ev.event === "error") {
        throw new Error(`Gemini LLM stream error: ${data.error?.message ?? ev.data.slice(0, 300)}`);
      }
      if (data.event_type === "step.delta" && data.delta?.type === "text" && data.delta.text) {
        yield data.delta.text;
      }
    }
  };
}

/** API キーが無いとき用。参照情報の先頭 2 項目をそれっぽく読み上げる */
export function createMockGenerator(): Generator {
  return async function* (input, signal) {
    const items = input.topic.body
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .slice(0, 2)
      .map((l) => l.slice(2).replace(/: /, "は、").replace(/。?$/, "。"));
    const text = `${items.join("")}（モック応答です）`;
    await sleep(300, signal); // TTFT の代わり
    for (let i = 0; i < text.length; i += 4) {
      await sleep(15, signal);
      yield text.slice(i, i + 4);
    }
  };
}
