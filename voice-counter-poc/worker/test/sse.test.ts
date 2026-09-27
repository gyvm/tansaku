import { describe, expect, it } from "vitest";
import { parseSse } from "../src/sse";

function streamOf(parts: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const p of parts) controller.enqueue(enc.encode(p));
      controller.close();
    },
  });
}

describe("parseSse", () => {
  it("チャンク境界をまたぐイベントを組み立てる", async () => {
    const body = streamOf([
      'event: step.delta\ndata: {"a":',
      '1}\n\nevent: done\r\n',
      "data: [DONE]\r\n\r\n",
    ]);
    const events = [];
    for await (const e of parseSse(body)) events.push(e);
    expect(events).toEqual([
      { event: "step.delta", data: '{"a":1}' },
      { event: "done", data: "[DONE]" },
    ]);
  });

  it("末尾に空行が無くても最後のイベントを返す", async () => {
    const events = [];
    for await (const e of parseSse(streamOf(["data: x"]))) events.push(e);
    expect(events).toEqual([{ event: null, data: "x" }]);
  });
});
