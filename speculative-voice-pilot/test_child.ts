import WebSocket from "ws";

const PORT = process.env.PORT || "3000";
const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
ws.binaryType = "arraybuffer";

let binaryBytesReceived = 0;
let winnerEvent: any = null;
let chainedPayloadEvent: any = null;

ws.on("open", async () => {
  console.log("Connected. Testing: 児童手当の申請...");

  console.log("🗣️ User: '子どもが生まれたので...'");
  ws.send(JSON.stringify({ type: "transcript", text: "子どもが生まれたので", isFinal: false }));
  await new Promise((r) => setTimeout(r, 1500));

  console.log("🗣️ User: '児童手当の手続きをしたいのですが...'");
  ws.send(JSON.stringify({ type: "transcript", text: "子どもが生まれたので、児童手当の手続きをしたいのですが", isFinal: false }));
  await new Promise((r) => setTimeout(r, 1500));

  console.log("🗣️ User: [Finished speaking]");
  ws.send(JSON.stringify({ type: "transcript", text: "子どもが生まれたので、児童手当の手続きをしたいのですが、何が必要ですか？", isFinal: true }));

  await new Promise((r) => setTimeout(r, 3500));

  console.log("\n================ TEST SUMMARY ================");
  console.log("Winner Event Received:", winnerEvent ? "YES" : "NO");
  if (winnerEvent) {
    console.log(`- Winner Stream ID: #${winnerEvent.streamId}`);
    console.log(`- Tier-1 Prefix Speech: "${winnerEvent.predictedResponse}"`);
    console.log(`- Turnaround Latency: ${winnerEvent.latencyMs} ms`);
    console.log(`- Pre-buffered Audio: ${winnerEvent.initialBytes} bytes (${(winnerEvent.initialBytes / 1024).toFixed(1)} KB)`);
    console.log(`- Initial Referenced Document: "${winnerEvent.sourceDoc}"`);
  }
  if (chainedPayloadEvent) {
    console.log(`- Tier-2 Chained Payload: "${chainedPayloadEvent.fullResponse}"`);
    console.log(`- Final Referenced Document: "${chainedPayloadEvent.sourceDoc}"`);
  }
  console.log(`Total Audio PCM Received: ${binaryBytesReceived} bytes`);
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
        console.log(`⚡ [WINNER ANNOUNCED] Stream #${msg.streamId} selected! Latency: ${msg.latencyMs}ms, Pre-buffered: ${msg.initialBytes}B`);
      } else if (msg.type === "winner_updated") {
        chainedPayloadEvent = msg;
        console.log(`🔗 [PAYLOAD CHAINED] "${msg.fullResponse}" (Ref: ${msg.sourceDoc})`);
      }
    } catch {}
  } else {
    const bytes = data instanceof Buffer ? data.length : data.byteLength;
    binaryBytesReceived += bytes;
  }
});
