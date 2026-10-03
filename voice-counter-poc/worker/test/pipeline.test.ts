import { describe, expect, it } from "vitest";
import { getTopic } from "../src/knowledge";
import type { Generator } from "../src/llm";
import { OUT_OF_SCOPE_MESSAGE, runTurn, type TurnDeps, type TurnSink } from "../src/pipeline";
import type { ServerMessage } from "../src/protocol";
import { type Classifier, createMockClassifier } from "../src/router";
import type { Synthesizer } from "../src/tts";

function recorder() {
  const events: (ServerMessage | { type: "audio"; seq: number; text: string })[] = [];
  const sink: TurnSink = {
    json: (m) => events.push(m),
    audio: (_t, seq, pcm) => events.push({ type: "audio", seq, text: new TextDecoder().decode(pcm) }),
  };
  return { events, sink };
}

const fixedRoute =
  (topicId: string, confidence = 0.9): Classifier =>
  async () => ({ kind: confidence >= 0.6 ? "answer" : "clarify", topic: getTopic(topicId)!, confidence, probabilities: { [topicId]: confidence, inkan: 0.1 } });

const textGenerator =
  (...deltas: string[]): Generator =>
  async function* () {
    yield* deltas;
  };

/** テキストをそのまま「音声」として 2 分割で返す偽 TTS。遅延を変えて並列性を確認する */
const fakeTts =
  (delays: Record<string, number> = {}): Synthesizer =>
  async function* (text) {
    await new Promise((r) => setTimeout(r, delays[text] ?? 0));
    const enc = new TextEncoder();
    const half = Math.ceil(text.length / 2);
    yield enc.encode(text.slice(0, half));
    yield enc.encode(text.slice(half));
  };

function deps(partial: Partial<TurnDeps>): TurnDeps {
  return {
    classify: fixedRoute("juminhyo"),
    generate: textGenerator("窓口は市民課です。", "手数料は300円です。"),
    synthesize: fakeTts(),
    now: () => performance.now(),
    ...partial,
  };
}

const input = { turnId: 1, utterance: "住民票がほしい", history: [], previousTopicId: null };

describe("runTurn", () => {
  it("復唱 → LLM 回答の順で読み上げ、音声は chunk ごとに順番通り届く", async () => {
    const { events, sink } = recorder();
    // 復唱の TTS をわざと遅くしても、送信順は変わらないこと
    const ack = getTopic("juminhyo")!.ack;
    const outcome = await runTurn(input, deps({ synthesize: fakeTts({ [ack]: 50 }) }), sink, new AbortController().signal);

    const speech = events.filter((e) => e.type === "speech_chunk" || e.type === "audio");
    expect(speech.map((e) => [e.type, "seq" in e ? e.seq : -1])).toEqual([
      ["speech_chunk", 0], ["audio", 0], ["audio", 0],
      ["speech_chunk", 1], ["audio", 1], ["audio", 1],
      ["speech_chunk", 2], ["audio", 2], ["audio", 2],
    ]);
    expect(outcome).toEqual({ topicId: "juminhyo", assistantText: `${ack}窓口は市民課です。手数料は300円です。` });

    const route = events.find((e) => e.type === "route");
    expect(route).toMatchObject({ kind: "answer", topicId: "juminhyo" });
    const metrics = events.find((e) => e.type === "metrics");
    expect(metrics && "marks" in metrics && Object.keys(metrics.marks)).toEqual(
      expect.arrayContaining(["routed", "firstChunk", "llmFirstToken", "ttsFirstByte", "done"]),
    );
    expect(events.at(-1)).toEqual({ type: "turn_end", turnId: 1 });
  });

  it("confidence が低いと LLM を呼ばず聞き返す", async () => {
    const { events, sink } = recorder();
    let llmCalled = false;
    const generate: Generator = async function* () {
      llmCalled = true;
      yield "x";
    };
    await runTurn(input, deps({ classify: fixedRoute("juminhyo", 0.4), generate }), sink, new AbortController().signal);
    expect(llmCalled).toBe(false);
    const chunk = events.find((e) => e.type === "speech_chunk");
    expect(chunk && "text" in chunk && chunk.text).toContain("住民票の写しの交付と印鑑登録・印鑑登録証明書の、どちら");
  });

  it("範囲外は定型文で案内し、話題をリセットする", async () => {
    const { events, sink } = recorder();
    const outcome = await runTurn(
      { ...input, utterance: "今日の天気は？", previousTopicId: null },
      deps({ classify: createMockClassifier(0.6) }),
      sink,
      new AbortController().signal,
    );
    expect(outcome).toEqual({ topicId: null, assistantText: OUT_OF_SCOPE_MESSAGE });
    expect(events.find((e) => e.type === "route")).toMatchObject({ kind: "out_of_scope" });
  });

  it("TTS 無し（ブラウザ読み上げモード）ではテキストに browserTts を付ける", async () => {
    const { events, sink } = recorder();
    await runTurn(input, deps({ synthesize: null }), sink, new AbortController().signal);
    const chunks = events.filter((e) => e.type === "speech_chunk");
    expect(chunks.length).toBe(3);
    expect(chunks.every((c) => "browserTts" in c && c.browserTts)).toBe(true);
    expect(events.some((e) => e.type === "audio")).toBe(false);
  });

  it("外部 API が失敗したらエラーを通知し、音声でもお詫びする", async () => {
    const { events, sink } = recorder();
    const classify: Classifier = async () => {
      throw new Error("Jev API error 529");
    };
    await runTurn(input, deps({ classify }), sink, new AbortController().signal);
    expect(events.find((e) => e.type === "error")).toMatchObject({ message: "Jev API error 529" });
    expect(events.find((e) => e.type === "speech_chunk")).toMatchObject({ browserTts: true });
    expect(events.at(-1)).toEqual({ type: "turn_end", turnId: 1 });
  });

  it("中断されたら例外を投げ、turn_end を送らない", async () => {
    const { events, sink } = recorder();
    const controller = new AbortController();
    const generate: Generator = async function* (_i, signal) {
      yield "途中まで、";
      controller.abort(new Error("superseded"));
      signal?.throwIfAborted();
    };
    await expect(runTurn(input, deps({ generate }), sink, controller.signal)).rejects.toThrow("superseded");
    expect(events.some((e) => e.type === "turn_end")).toBe(false);
  });
});

describe("mock classifier", () => {
  const classify = createMockClassifier(0.6);
  it("キーワードでトピックを選ぶ", async () => {
    const r = await classify({ utterance: "粗大ごみを出したい", previousTopicId: null, previousAssistantText: null });
    expect(r.topic?.id).toBe("gomi");
  });
  it("キーワードが無ければ直前の話題の続きとみなす", async () => {
    const r = await classify({ utterance: "それって何を持っていけばいいですか", previousTopicId: "tennyu", previousAssistantText: null });
    expect(r.topic?.id).toBe("tennyu");
  });
  it("指示語の無い無関係な発話は、前の話題があっても範囲外", async () => {
    const r = await classify({ utterance: "今日の天気はどうですか", previousTopicId: "tennyu", previousAssistantText: null });
    expect(r.kind).toBe("out_of_scope");
  });
  it("転入・転出・転居のどれか曖昧なら聞き返す", async () => {
    const r = await classify({ utterance: "引っ越しの手続きを知りたい", previousTopicId: null, previousAssistantText: null });
    expect(r.kind).toBe("clarify");
  });
});
