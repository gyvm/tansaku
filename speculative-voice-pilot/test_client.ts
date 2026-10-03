import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000/ws");
ws.binaryType = "arraybuffer";

let binaryBytesReceived = 0;
let winnerEvent: any = null;

ws.on("open", async () => {
  console.log("Connected to WebSocket. Starting speculative simulation...");

  // Step 1: ユーザーが喋り始める
  console.log("User speaking: '住民票を'");
  ws.send(JSON.stringify({ type: "transcript", text: "住民票を", isFinal: false }));

  await new Promise((r) => setTimeout(r, 400));

  // Step 2: 途中で話が展開
  console.log("User speaking: '他の区から引っ越してきたので'");
  ws.send(JSON.stringify({ type: "transcript", text: "他の区から引っ越してきたので", isFinal: false }));

  await new Promise((r) => setTimeout(r, 600));

  // Step 3: 言い終わる
  console.log("User finished speaking: '住民票を取りたいんですけど。'");
  const finishedAt = Date.now();
  ws.send(JSON.stringify({ type: "transcript", text: "住民票を取りたいんですけど。", isFinal: true }));

  // 1秒待って結果を確認
  await new Promise((r) => setTimeout(r, 2000));

  console.log("\n================ TEST SUMMARY ================");
  console.log("Winner Event Received:", winnerEvent ? "YES" : "NO");
  if (winnerEvent) {
    console.log(`- Winner Stream ID: #${winnerEvent.streamId}`);
    console.log(`- Predicted Response: "${winnerEvent.predictedResponse}"`);
    console.log(`- Server Selection Latency: ${winnerEvent.latencyMs} ms`);
    console.log(`- Initial Buffered Bytes: ${winnerEvent.initialBytes} bytes`);
    console.log(`- Referenced Document: "${winnerEvent.sourceDoc}"`);
  }
  console.log(`Total Audio PCM Bytes Received: ${binaryBytesReceived} bytes`);
  console.log("==============================================\n");

  ws.close();
  process.exit(0);
});

ws.on("message", (data: any, isBinary: boolean) => {
  // 文字列または JSON で始まる Buffer の場合
  let isJson = false;
  let text = "";
  if (typeof data === "string") {
    isJson = true;
    text = data;
  } else {
    const bytes = data instanceof Buffer ? data : new Uint8Array(data);
    if (bytes.length > 0 && bytes[0] === 0x7b) {
      try {
        text = new TextDecoder().decode(bytes);
        JSON.parse(text);
        isJson = true;
      } catch {
        isJson = false;
      }
    }
  }

  if (isJson) {
    try {
      const msg = JSON.parse(text);
      if (msg.type === "streams_update") {
        console.log(
          `[Stream Update] Active streams: ${msg.streams.length} (Buffered: ${msg.streams.map((s: any) => `#${s.streamId}:${s.bufferedBytes}B`).join(", ")})`
        );
      } else if (msg.type === "winner_selected") {
        winnerEvent = msg;
        console.log(`⚡ [WINNER ANNOUNCED] Stream #${msg.streamId} selected with ${msg.initialBytes}B pre-buffered!`);
      }
    } catch (e: any) {
      console.error("JSON parse error:", e);
    }
  } else {
    // バイナリ (Buffer / ArrayBuffer)
    const bytes = data instanceof Buffer ? data.length : data.byteLength;
    binaryBytesReceived += bytes;
    console.log(`[Audio Chunk Received] ${bytes} bytes (Total: ${binaryBytesReceived} bytes)`);
  }
});
