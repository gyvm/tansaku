// 意図判定（ルーティング）。Jev の choice 質問で「どのトピックの問い合わせか」を判定する。
// API: https://docs.typesafe.ai/api  （POST /v1/systemone）

import { TOPICS, type Topic } from "./knowledge";
import type { RouteKind } from "./protocol";

export const OUT_OF_SCOPE = "out_of_scope";

export interface RouteInput {
  utterance: string;
  /** 直前に話していたトピック（「それって何が必要？」のような追加質問の解決に使う） */
  previousTopicId: string | null;
  /** 直前に AI が話した内容（聞き返しへの回答を解釈するため） */
  previousAssistantText: string | null;
}

export interface RouteResult {
  kind: RouteKind;
  topic: Topic | null;
  confidence: number;
  /** トピック ID → 確率（out_of_scope を含む） */
  probabilities: Record<string, number>;
}

export type Classifier = (input: RouteInput, signal?: AbortSignal) => Promise<RouteResult>;

const INSTRUCTIONS =
  "これは市役所の電話窓口にかかってきた市民の発話です。" +
  "問い合わせ内容に最も当てはまる手続き・案内を選んでください。" +
  "previous_topic は直前に話していた話題です。「それ」「その手続き」などの指示語や、" +
  "話題を明示しない追加の質問は previous_topic の続きとして扱ってください。" +
  "previous_assistant_text が聞き返しの場合は、その選択肢への回答として解釈してください。" +
  "どれにも当てはまらない場合は out_of_scope を選んでください。";

export function buildCriteria(topics: readonly Topic[] = TOPICS): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const t of topics) criteria[t.id] = `${t.title}: ${t.description}`;
  criteria[OUT_OF_SCOPE] = "上記のどれにも当てはまらない問い合わせ、雑談、市役所の業務と関係のない話題";
  return criteria;
}

export function buildJevRequest(input: RouteInput, model: string) {
  const previousTopic = input.previousTopicId
    ? (TOPICS.find((t) => t.id === input.previousTopicId)?.title ?? null)
    : null;
  return {
    model,
    state: {
      utterance: input.utterance,
      previous_topic: previousTopic,
      previous_assistant_text: input.previousAssistantText,
    },
    questions: {
      topic: {
        type: "choice",
        instructions: INSTRUCTIONS,
        criteria: buildCriteria(),
      },
    },
  };
}

interface JevResponse {
  answers: {
    topic?: {
      choice?: string;
      probabilities?: Record<string, number>;
      confidence?: number;
    };
  };
}

export function toRouteResult(
  choice: string,
  confidence: number,
  probabilities: Record<string, number>,
  threshold: number,
): RouteResult {
  const topic = TOPICS.find((t) => t.id === choice) ?? null;
  if (!topic) return { kind: "out_of_scope", topic: null, confidence, probabilities };
  return {
    kind: confidence >= threshold ? "answer" : "clarify",
    topic,
    confidence,
    probabilities,
  };
}

export function createJevClassifier(apiKey: string, model: string, threshold: number): Classifier {
  return async (input, signal) => {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildJevRequest(input, model)),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Jev API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as JevResponse;
    const answer = json.answers.topic;
    if (!answer?.choice) throw new Error("Jev API returned no choice for 'topic'");
    return toRouteResult(answer.choice, answer.confidence ?? 0, answer.probabilities ?? {}, threshold);
  };
}

/**
 * API キーが無いとき用のキーワードマッチ分類器。
 * デモの流れ（復唱 → 回答 / 聞き返し / 範囲外）を確認するためだけのもので、精度は期待しない。
 */
export function createMockClassifier(threshold: number): Classifier {
  return async (input) => {
    const text = input.utterance;
    const scores: Record<string, number> = {};
    for (const t of TOPICS) {
      let score = 0;
      for (const k of t.keywords) if (text.includes(k)) score += k.length;
      if (text.includes(t.title)) score += t.title.length;
      scores[t.id] = score;
    }
    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    // キーワードが無く、指示語を含み、前の話題がある → 追加質問とみなす
    if (total === 0 && input.previousTopicId && /(それ|その|そちら|あれ|これ|この)/.test(text)) {
      return toRouteResult(input.previousTopicId, 0.7, { [input.previousTopicId]: 0.7 }, threshold);
    }
    if (total === 0) {
      return { kind: "out_of_scope", topic: null, confidence: 0.9, probabilities: { [OUT_OF_SCOPE]: 0.9 } };
    }
    const probabilities: Record<string, number> = {};
    for (const [id, s] of Object.entries(scores)) if (s > 0) probabilities[id] = s / total;
    const [bestId, best] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0];
    return toRouteResult(bestId, best, probabilities, threshold);
  };
}

/** 聞き返し用に、確率上位の候補トピックを返す */
export function topCandidates(probabilities: Record<string, number>, n = 2): { topic: Topic; probability: number }[] {
  return Object.entries(probabilities)
    .filter(([id]) => id !== OUT_OF_SCOPE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .flatMap(([id, probability]) => {
      const topic = TOPICS.find((t) => t.id === id);
      return topic ? [{ topic, probability }] : [];
    });
}
