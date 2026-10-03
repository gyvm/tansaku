import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000/ws");
ws.binaryType = "arraybuffer";

let binaryBytesReceived = 0;
let winnerEvent: any = null;

ws.on("open", async () => {
  console.log("Connected. Testing scenario: マイナンバー暗証番号再設定...");

  // 発話途中 1
  ws.send(JSON.stringify({ type: "transcript", text: "暗証番号を", isFinal: false }));
  await new Promise((r) => setTimeout(r, 400));

  // 発話途中 2
  ws.send(JSON.stringify({ type: "transcript", text: "暗証番号を忘れてしまって", isFinal: false }));
  await new Promise((r) => setTimeout(r, 600));

  // 発話終了
  ws.send(JSON.stringify({ type: "transcript", text: "暗証番号を忘れてしまって、どうしたらいいですか？", isFinal: true }));

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

ws.on("message", (data: any) => {
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
      if (msg.type === "winner_selected") {
        winnerEvent = msg;
        console.log(`⚡ [WINNER ANNOUNCED] Stream #${msg.streamId} selected with ${msg.initialBytes}B pre-buffered!`);
      }
    } catch {}
  } else {
    const bytes = data instanceof Buffer ? data.length : data.byteLength;
    binaryBytesReceived += bytes;
  }
});
