import { describe, expect, it } from "vitest";
import { customVocabulary, parseTopic, TOPICS } from "../src/knowledge";
import { buildCriteria, buildJevRequest, OUT_OF_SCOPE } from "../src/router";

describe("knowledge", () => {
  it("全トピックが読み込め、ID が一意", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    for (const t of TOPICS) {
      expect(t.ack.endsWith("。")).toBe(true);
      expect(t.body.length).toBeGreaterThan(50);
    }
  });

  it("フロントマターが無いとエラー", () => {
    expect(() => parseTopic("# no meta")).toThrow();
  });

  it("カスタム語彙は重複なし・上限以内", () => {
    const vocab = customVocabulary(100);
    expect(vocab.length).toBeLessThanOrEqual(100);
    expect(new Set(vocab).size).toBe(vocab.length);
  });
});

describe("Jev リクエスト", () => {
  it("全トピック + out_of_scope を choice の選択肢にする（上限 255）", () => {
    const criteria = buildCriteria();
    expect(Object.keys(criteria)).toContain(OUT_OF_SCOPE);
    expect(Object.keys(criteria).length).toBe(TOPICS.length + 1);
    expect(Object.keys(criteria).length).toBeLessThanOrEqual(255);
  });

  it("直前の話題を state に含める", () => {
    const req = buildJevRequest(
      { utterance: "それって何が必要？", previousTopicId: "tennyu", previousAssistantText: null },
      "jev-latest",
    );
    expect(req.state.previous_topic).toBe("転入届（他の市区町村からの引っ越し）");
    expect(req.questions.topic.type).toBe("choice");
  });
});
