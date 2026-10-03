import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { WebSocketServer, WebSocket } from "ws";
import { SpeculativeStreamManager, TTSEngineType } from "./speculative_manager.js";

// ~/.zshrc.local から API キーを読み込む
function loadEnvFromZshrcLocal() {
  const zshrcLocalPath = path.join(os.homedir(), ".zshrc.local");
  if (fs.existsSync(zshrcLocalPath)) {
    const content = fs.readFileSync(zshrcLocalPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^export\s+([A-Za-z0-9_]+)=["']?([^"']+)["']?/);
      if (match) {
        const [, key, val] = match;
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFromZshrcLocal();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`[Config] Gemini Key: ${GEMINI_API_KEY ? "YES" : "NO"} | ElevenLabs Key: ${ELEVENLABS_API_KEY ? "YES" : "NO"}`);

const PUBLIC_DIR = path.join(process.cwd(), "public");

// HTTP サーバー（静的ファイル配信）
const server = http.createServer((req, res) => {
  let reqPath = req.url?.split("?")[0] || "/";
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(PUBLIC_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }

  const ext = path.extname(filePath);
  let contentType = "text/html; charset=utf-8";
  if (ext === ".js") contentType = "application/javascript; charset=utf-8";
  if (ext === ".css") contentType = "text/css; charset=utf-8";
  if (ext === ".json") contentType = "application/json; charset=utf-8";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
});

// WebSocket サーバー
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log(" Client connected to WebSocket");

  // デフォルト TTS は Gemini TTS (超低コスト & 高音質)
  const initialTTS: TTSEngineType = GEMINI_API_KEY ? "gemini" : "elevenlabs";
  const manager = new SpeculativeStreamManager(
    GEMINI_API_KEY,
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID,
    initialTTS,
    path.join(process.cwd(), "docs")
  );

  // 投機ストリーム一覧の更新をクライアントへ通知
  manager.onStreamUpdate = (streams) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "streams_update", streams }));
    }
  };

  // 発話終了時に勝者ストリームが選定された瞬間
  manager.onWinnerReady = (winner, initialChunks, latencyMs) => {
    console.log(
      `🏆 [Winner Selected] Stream #${winner.streamId}: "${winner.predictedResponse}" (${winner.bufferedBytes}B, Latency: ${latencyMs}ms, Ref: ${winner.sourceDoc})`
    );

    if (ws.readyState === WebSocket.OPEN) {
      // 1. 勝者選定メタデータを通知
      ws.send(
        JSON.stringify({
          type: "winner_selected",
          streamId: winner.streamId,
          predictedResponse: winner.predictedResponse,
          sourceDoc: winner.sourceDoc,
          latencyMs,
          initialBytes: winner.bufferedBytes
        })
      );

      // 2. 既にメモリに蓄積された PCM 音声チャンクを結合して送出！
      if (initialChunks.length > 0) {
        const combined = Buffer.concat(initialChunks);
        ws.send(combined);
      }
    }
  };

  // 後から受信したチャンクを順次転送
  manager.onWinnerChunk = (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  };

  // Payload 核心回答が結合された時の更新通知
  manager.onWinnerUpdated = (fullResponse, sourceDoc) => {
    console.log(`🔗 [Payload Chained] "${fullResponse}" (Ref: ${sourceDoc})`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "winner_updated",
          fullResponse,
          sourceDoc
        })
      );
    }
  };

  // クライアントからのメッセージ受信
  ws.on("message", (data, isBinary) => {
    if (isBinary) return;

    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "transcript") {
        const { text, isFinal } = msg;
        console.log(`[User Speech] "${text}" (final: ${isFinal})`);
        manager.handleUserTranscript(text, isFinal);
      } else if (msg.type === "set_tts") {
        if (msg.engine === "gemini" || msg.engine === "elevenlabs") {
          manager.setTTSEngine(msg.engine);
        }
      } else if (msg.type === "reset") {
        manager.resetContext();
      }
    } catch (err: any) {
      console.error("Failed to parse message:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    manager.abortAllStreams();
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Speculative Voice Pilot running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   TTS Engine: ${GEMINI_API_KEY ? "Gemini TTS (Kore)" : "ElevenLabs"}`);
  console.log(`   LLM Dialog Engine: Gemini 3.5 Flash Lite`);
  console.log(`   Municipal Docs: 30 files loaded from /docs`);
  console.log(`=======================================================`);
});
