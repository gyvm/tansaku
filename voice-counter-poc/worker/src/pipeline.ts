// 1 ターン（ユーザー発話 1 回）分の処理。
//
//   発話テキスト ─▶ Jev で意図判定 ─┬─▶ 復唱を即読み上げ（キャッシュ済みなら TTS 待ち 0）
//                                  └─▶ LLM ストリーミング ─▶ チャンク分割 ─▶ TTS ─▶ クライアントへ
//
// 読み上げは「チャンクごとに TTS を即開始（並列）し、送信は順番通り」にする。
// こうすると前のチャンクを再生している間に次のチャンクの音声が用意できる。

import { prefetch } from "./async";
import { SpeechChunker } from "./chunker";
import type { Topic } from "./knowledge";
import type { Generator, HistoryEntry } from "./llm";
import type { ServerMark, ServerMessage } from "./protocol";
import { type Classifier, type RouteResult, topCandidates } from "./router";
import type { Synthesizer } from "./tts";

export const OUT_OF_SCOPE_MESSAGE =
  "申し訳ありません。そのご質問には、この自動応答ではすぐにお答えできません。" +
  "担当課に確認のうえ、改めてご連絡いたします。市のホームページもあわせてご覧ください。";

export const ERROR_MESSAGE = "申し訳ありません。ただいま回答を用意できませんでした。もう一度お話しいただけますか。";

export interface TurnDeps {
  classify: Classifier;
  generate: Generator;
  /** null のときはブラウザの speechSynthesis で読み上げる（テキストだけ送る） */
  synthesize: Synthesizer | null;
  now: () => number;
}

export interface TurnInput {
  turnId: number;
  utterance: string;
  history: HistoryEntry[];
  previousTopicId: string | null;
}

export interface TurnSink {
  json(message: ServerMessage): void;
  audio(turnId: number, seq: number, pcm: Uint8Array): void;
}

export interface TurnOutcome {
  topicId: string | null;
  assistantText: string;
}

/** 読み上げ用にタイトルの括弧書きを落とす（例: 「転入届（他の市区町村からの引っ越し）」→「転入届」） */
const spokenTitle = (t: Topic) => t.title.replace(/（[^）]*）/g, "");

export function clarifyMessage(candidates: Topic[]): string {
  if (candidates.length >= 2) {
    return `恐れ入ります。${spokenTitle(candidates[0])}と${spokenTitle(candidates[1])}の、どちらについてのご質問でしょうか。`;
  }
  if (candidates.length === 1) {
    return `恐れ入ります。${spokenTitle(candidates[0])}についてのご質問でしょうか。`;
  }
  return "恐れ入ります。もう少し詳しくお聞かせいただけますか。";
}

export async function runTurn(input: TurnInput, deps: TurnDeps, sink: TurnSink, signal: AbortSignal): Promise<TurnOutcome> {
  const { turnId } = input;
  const start = deps.now();
  const marks: Partial<Record<ServerMark, number>> = {};
  const mark = (name: ServerMark) => {
    marks[name] ??= Math.round(deps.now() - start);
  };

  // ---- 読み上げキュー（TTS は並列に開始、送信は順番通り） ----
  let seq = 0;
  let speaking: Promise<void> = Promise.resolve();
  const spoken: string[] = [];
  const speak = (text: string) => {
    const mySeq = seq++;
    spoken.push(text);
    const audio = deps.synthesize ? prefetch(deps.synthesize(text, signal)) : null;
    speaking = speaking.then(async () => {
      if (signal.aborted) return;
      sink.json({ type: "speech_chunk", turnId, seq: mySeq, text, browserTts: !audio || undefined });
      if (!audio) {
        mark("ttsFirstByte");
        return;
      }
      for await (const pcm of audio) {
        if (signal.aborted) return;
        mark("ttsFirstByte");
        sink.audio(turnId, mySeq, pcm);
      }
    });
    // 失敗は最後の await speaking で拾う。ここでは unhandled rejection を防ぐだけ
    speaking.catch(() => {});
  };

  let topicId = input.previousTopicId;
  try {
    // ---- 1. 意図判定 ----
    const previousAssistantText = [...input.history].reverse().find((h) => h.role === "assistant")?.text ?? null;
    const route: RouteResult = await deps.classify(
      { utterance: input.utterance, previousTopicId: input.previousTopicId, previousAssistantText },
      signal,
    );
    mark("routed");
    const candidates = topCandidates(route.probabilities);
    sink.json({
      type: "route",
      turnId,
      kind: route.kind,
      topicId: route.topic?.id ?? null,
      topicTitle: route.topic?.title ?? null,
      confidence: route.confidence,
      candidates: candidates.map((c) => ({ topicId: c.topic.id, title: c.topic.title, probability: c.probability })),
    });

    // ---- 2a. 範囲外 / 聞き返し：LLM を使わず定型文で即答 ----
    if (route.kind !== "answer" || !route.topic) {
      const text = route.kind === "clarify" ? clarifyMessage(candidates.map((c) => c.topic)) : OUT_OF_SCOPE_MESSAGE;
      mark("firstChunk");
      sink.json({ type: "assistant_delta", turnId, text });
      speak(text);
      if (route.kind === "out_of_scope") topicId = null;
    } else {
      // ---- 2b. 回答：復唱を先に読み上げつつ LLM を開始 ----
      const topic = route.topic;
      topicId = topic.id;
      mark("firstChunk");
      sink.json({ type: "assistant_delta", turnId, text: topic.ack });
      speak(topic.ack);

      const chunker = new SpeechChunker();
      for await (const delta of deps.generate({ utterance: input.utterance, topic, history: input.history }, signal)) {
        mark("llmFirstToken");
        sink.json({ type: "assistant_delta", turnId, text: delta });
        for (const chunk of chunker.push(delta)) speak(chunk);
      }
      for (const chunk of chunker.flush()) speak(chunk);
    }

    await speaking;
  } catch (e) {
    if (signal.aborted) throw e;
    await speaking.catch(() => {});
    sink.json({ type: "error", turnId, message: e instanceof Error ? e.message : String(e) });
    // 音声でもエラーを伝える（TTS 自体が壊れている可能性があるのでテキストのみ）
    sink.json({ type: "speech_chunk", turnId, seq: seq++, text: ERROR_MESSAGE, browserTts: true });
    spoken.push(ERROR_MESSAGE);
  }

  mark("done");
  sink.json({ type: "metrics", turnId, marks });
  sink.json({ type: "turn_end", turnId });
  return { topicId, assistantText: spoken.join("") };
}
