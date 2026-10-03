// 通話 1 本 = Durable Object 1 インスタンス。
// WebSocket Hibernation API（ctx.acceptWebSocket）を使うので、ユーザーが黙っている間は
// DO がメモリから退避されても接続は維持される（その間の Duration 課金も発生しない）。
// そのため会話状態はメモリではなく DO Storage に置く。

import { DurableObject } from "cloudflare:workers";
import type { Env } from "./env";
import { createGeminiGenerator, createMockGenerator, type HistoryEntry } from "./llm";
import { runTurn, type TurnDeps } from "./pipeline";
import { type ClientMessage, encodeAudioFrame, type ServerMessage, type ServiceModes } from "./protocol";
import { createJevClassifier, createMockClassifier } from "./router";
import { createGeminiSynthesizer, TTS_SAMPLE_RATE, withCache } from "./tts";

interface CallState {
  history: HistoryEntry[];
  lastTopicId: string | null;
}

const EMPTY_STATE: CallState = { history: [], lastTopicId: null };
const MAX_HISTORY = 6;

// 復唱・定型文の TTS キャッシュを isolate 内で共有するため、モジュールスコープに置く
let cachedSynth: { key: string; synth: ReturnType<typeof withCache> } | null = null;

export function serviceModes(env: Env): ServiceModes {
  return {
    router: env.JEV_API_KEY ? "jev" : "mock",
    llm: env.GEMINI_API_KEY ? "gemini" : "mock",
    tts: env.GEMINI_API_KEY ? "gemini" : "browser",
  };
}

function buildDeps(env: Env): TurnDeps {
  const threshold = Number(env.ROUTE_CONFIDENCE_THRESHOLD) || 0.6;
  let synthesize: TurnDeps["synthesize"] = null;
  if (env.GEMINI_API_KEY) {
    const key = [env.GEMINI_API_KEY, env.TTS_MODEL, env.TTS_VOICE, env.TTS_STYLE].join("|");
    if (cachedSynth?.key !== key) {
      cachedSynth = {
        key,
        synth: withCache(createGeminiSynthesizer(env.GEMINI_API_KEY, env.TTS_MODEL, env.TTS_VOICE, env.TTS_STYLE)),
      };
    }
    synthesize = cachedSynth.synth;
  }
  return {
    classify: env.JEV_API_KEY
      ? createJevClassifier(env.JEV_API_KEY, env.JEV_MODEL, threshold)
      : createMockClassifier(threshold),
    generate: env.GEMINI_API_KEY
      ? createGeminiGenerator(env.GEMINI_API_KEY, env.LLM_MODEL, env.LLM_THINKING_LEVEL)
      : createMockGenerator(),
    synthesize,
    now: () => performance.now(),
  };
}

export class CallSession extends DurableObject<Env> {
  /** 実行中のターン（新しい発話が来たら前のターンは打ち切る） */
  private current: AbortController | null = null;

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    send(server, { type: "ready", modes: serviceModes(this.env), ttsSampleRate: TTS_SAMPLE_RATE });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== "string") return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      send(ws, { type: "error", message: "invalid JSON" });
      return;
    }

    if (msg.type === "reset") {
      this.current?.abort();
      await this.ctx.storage.delete("state");
      return;
    }
    if (msg.type === "user_utterance" && msg.text.trim()) {
      await this.handleUtterance(ws, msg.turnId, msg.text.trim());
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.current?.abort();
    ws.close(code, reason);
  }

  private async handleUtterance(ws: WebSocket, turnId: number, utterance: string): Promise<void> {
    this.current?.abort();
    const controller = new AbortController();
    this.current = controller;

    const state = (await this.ctx.storage.get<CallState>("state")) ?? EMPTY_STATE;
    try {
      const outcome = await runTurn(
        { turnId, utterance, history: state.history, previousTopicId: state.lastTopicId },
        buildDeps(this.env),
        {
          json: (m) => send(ws, m),
          audio: (t, seq, pcm) => ws.send(encodeAudioFrame(t, seq, pcm)),
        },
        controller.signal,
      );
      const history: HistoryEntry[] = [
        ...state.history,
        { role: "user" as const, text: utterance },
        { role: "assistant" as const, text: outcome.assistantText },
      ].slice(-MAX_HISTORY);
      await this.ctx.storage.put<CallState>("state", { history, lastTopicId: outcome.topicId });
    } catch (e) {
      if (!controller.signal.aborted) throw e;
      // 新しい発話で打ち切られた → 何もしない
    } finally {
      if (this.current === controller) this.current = null;
    }
  }
}

function send(ws: WebSocket, message: ServerMessage): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // 切断済み
  }
}
