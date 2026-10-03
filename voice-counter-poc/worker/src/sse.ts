// Server-Sent Events の最小パーサ。
// Gemini Interactions API の stream: true レスポンスは
//   event: step.delta
//   data: {...}
// の形式で届く。ネットワークのチャンク境界と行の境界は一致しないので、バッファしながら読む。

export interface SseEvent {
  event: string | null;
  data: string;
}

export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let event: string | null = null;
  let data: string[] = [];

  /** 1 行を処理し、イベントが完成したら返す */
  const handleLine = (line: string): SseEvent | null => {
    if (line === "") {
      // 空行 = イベントの区切り
      const complete = data.length > 0 ? { event, data: data.join("\n") } : null;
      event = null;
      data = [];
      return complete;
    }
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    // コメント行（":"始まり）や id: / retry: は使わないので無視
    return null;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        const complete = handleLine(line);
        if (complete) yield complete;
      }
    }
    // 改行で終わっていない最終行と、空行で閉じられていない最終イベント
    if (buffer) handleLine(buffer.replace(/\r$/, ""));
    const last = handleLine("");
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}
