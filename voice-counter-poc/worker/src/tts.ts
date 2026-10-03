// 音声合成。Gemini TTS をストリーミングで呼び、PCM（16bit LE / 24kHz / mono）を yield する。
// https://ai.google.dev/gemini-api/docs/speech-generation#streaming-speech-generation

import { base64ToBytes } from "./async";
import { parseSse } from "./sse";

export const TTS_SAMPLE_RATE = 24000;

export type Synthesizer = (text: string, signal?: AbortSignal) => AsyncIterable<Uint8Array>;

export function createGeminiSynthesizer(apiKey: string, model: string, voice: string, style: string): Synthesizer {
  return async function* (text, signal) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text,
                annotations: [{ type: "speech_metadata", style }],
              },
            ],
          },
        ],
        response_format: { type: "audio", mime_type: "audio/l16", sample_rate: TTS_SAMPLE_RATE },
        generation_config: { speech_config: [{ voice }] },
        stream: true,
        store: false,
      }),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Gemini TTS error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    for await (const ev of parseSse(res.body)) {
      if (ev.data === "[DONE]") break;
      const data = JSON.parse(ev.data) as {
        event_type?: string;
        delta?: { type?: string; data?: string };
        error?: { message?: string };
      };
      if (data.event_type === "error" || ev.event === "error") {
        throw new Error(`Gemini TTS stream error: ${data.error?.message ?? ev.data.slice(0, 300)}`);
      }
      if (data.event_type === "step.delta" && data.delta?.type === "audio" && data.delta.data) {
        yield base64ToBytes(data.delta.data);
      }
    }
  };
}

/**
 * 同じ文言（復唱や定型文）の音声をメモリにキャッシュする。
 * Workers の isolate が生きている間だけ有効な簡易キャッシュ。2 回目以降は TTS 待ちが 0 になる。
 */
export function withCache(synth: Synthesizer, maxEntries = 100): Synthesizer {
  const cache = new Map<string, Uint8Array[]>();
  return async function* (text, signal) {
    const hit = cache.get(text);
    if (hit) {
      yield* hit;
      return;
    }
    const parts: Uint8Array[] = [];
    for await (const part of synth(text, signal)) {
      parts.push(part);
      yield part;
    }
    if (cache.size >= maxEntries) cache.delete(cache.keys().next().value as string);
    cache.set(text, parts);
  };
}
