// 通話全体の制御。React から切り離したクラスにして、UI は useSyncExternalStore で購読する。
//
//   マイク ─▶ STT（Gemini Live に直接接続）─▶ 確定テキスト ─▶ Worker/DO（WebSocket）
//                                                              │
//   スピーカー ◀─ PcmPlayer ◀─ PCM バイナリ / テキスト ◀─────────┘
//
// 割り込み（barge-in）は非対応。AI の応答中は STT を止める（半二重）。

import {
  type ClientMessage,
  decodeAudioFrame,
  type RouteKind,
  type ServerMark,
  type ServerMessage,
  type ServiceModes,
} from "../../worker/src/protocol";
import { type Mic, startMic } from "./audio/mic";
import { BrowserSpeaker, PcmPlayer } from "./audio/player";
import { GeminiLiveStt } from "./stt/geminiLive";
import type { SttEngine } from "./stt/types";
import { WebSpeechStt } from "./stt/webSpeech";

export type CallStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface Turn {
  turnId: number;
  source: "voice" | "text";
  userText: string;
  assistantText: string;
  route?: {
    kind: RouteKind;
    topicTitle: string | null;
    confidence: number;
    candidates: { title: string; probability: number }[];
  };
  /** クライアント側の時刻（performance.now） */
  times: { speechEnd: number; sttFinal: number; route?: number; firstText?: number; firstAudio?: number };
  serverMarks: Partial<Record<ServerMark, number>>;
  done: boolean;
  error?: string;
}

export interface CallSnapshot {
  status: CallStatus;
  modes: ServiceModes | null;
  sttLabel: string | null;
  interim: string;
  level: number;
  turns: Turn[];
  notice: string | null;
  hybridVad: boolean;
}

/** クライアント側 VAD：この時間無音が続いたら発話終了とみなす */
const HYBRID_SILENCE_MS = 600;
/** AI の再生が終わってから STT を再開するまでの余白（残響を拾わないため） */
const RESUME_GAP_MS = 300;

export class CallController {
  private snapshot: CallSnapshot = {
    status: "idle",
    modes: null,
    sttLabel: null,
    interim: "",
    level: 0,
    turns: [],
    notice: null,
    hybridVad: false,
  };
  private listeners = new Set<() => void>();

  private ctx: AudioContext | null = null;
  private ws: WebSocket | null = null;
  private mic: Mic | null = null;
  private stt: SttEngine | null = null;
  private player: PcmPlayer | null = null;
  private speaker: BrowserSpeaker | null = null;
  private busyTimer: number | null = null;

  private nextTurnId = 1;
  private currentTurnId = 0;
  private inFlight = false;
  private sttPaused = false;
  private lastBusyAt = 0;

  // VAD の状態
  private noiseFloor = 0.005;
  private voicedRun = 0;
  private inSpeech = false;
  private lastVoiceAt = 0;

  // ---- useSyncExternalStore 用 ----
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;

  private set(patch: Partial<CallSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((l) => l());
  }

  private updateTurn(turnId: number, fn: (t: Turn) => Turn) {
    this.set({ turns: this.snapshot.turns.map((t) => (t.turnId === turnId ? fn(t) : t)) });
  }

  // ---- 操作 ----

  async start(): Promise<void> {
    if (this.snapshot.status !== "idle") return;
    this.set({ status: "connecting", notice: null });
    try {
      // AudioContext はユーザー操作（クリック）の中で作らないと音が出ない（自動再生ポリシー）
      this.ctx = new AudioContext();
      await this.ctx.resume();
      this.speaker = new BrowserSpeaker();

      const ready = await this.connectSession();
      this.player = new PcmPlayer(this.ctx, ready.ttsSampleRate);
      this.set({ modes: ready.modes });

      this.mic = await startMic(this.ctx, (chunk) => {
        this.set({ level: chunk.rms });
        this.detectSpeech(chunk.rms, chunk.at);
        this.stt?.pushAudio(chunk.pcm);
      });
      this.stt = await this.createStt();
      await this.stt.start();
      this.set({ sttLabel: this.stt.label, status: "listening" });
      this.busyTimer = window.setInterval(() => this.tick(), 100);
    } catch (e) {
      this.set({ notice: `開始できませんでした: ${e instanceof Error ? e.message : String(e)}` });
      this.stop();
    }
  }

  stop(): void {
    if (this.busyTimer !== null) clearInterval(this.busyTimer);
    this.busyTimer = null;
    this.stt?.stop();
    this.mic?.stop();
    this.ws?.close();
    this.player?.stop();
    this.speaker?.stop();
    void this.ctx?.close();
    this.stt = this.mic = this.ws = this.player = this.speaker = this.ctx = null;
    this.inFlight = false;
    this.sttPaused = false;
    this.set({ status: "idle", interim: "", level: 0, sttLabel: null });
  }

  /** テキストで質問する（マイクなしでパイプラインを確認する用） */
  sendText(text: string): void {
    const now = performance.now();
    this.sendUtterance(text, "text", now, now);
  }

  reset(): void {
    this.send({ type: "reset" });
    this.player?.stop();
    this.speaker?.stop();
    this.set({ turns: [] });
  }

  setHybridVad(enabled: boolean): void {
    this.set({ hybridVad: enabled });
  }

  // ---- 内部処理 ----

  private connectSession(): Promise<{ modes: ServiceModes; ttsSampleRate: number }> {
    const sid = crypto.randomUUID();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws?sid=${sid}`);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    return new Promise((resolve, reject) => {
      ws.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
        if (typeof e.data !== "string") {
          this.onAudio(e.data);
          return;
        }
        const msg = JSON.parse(e.data) as ServerMessage;
        if (msg.type === "ready") resolve({ modes: msg.modes, ttsSampleRate: msg.ttsSampleRate });
        else this.onServerMessage(msg);
      };
      ws.onerror = () => reject(new Error("セッションに接続できません（wrangler dev は起動していますか？）"));
      ws.onclose = () => {
        if (this.ws === ws && this.snapshot.status !== "idle") {
          this.set({ notice: "セッションが切断されました" });
          this.stop();
        }
      };
    });
  }

  private async createStt(): Promise<SttEngine> {
    const handlers = {
      onInterim: (text: string) => this.set({ interim: text }),
      onFinal: (text: string) => {
        this.set({ interim: "" });
        if (!text.trim()) return;
        const now = performance.now();
        // 発話終了時刻は VAD で最後に声を検知した時刻（無ければ確定時刻）で近似する
        const speechEnd = this.lastVoiceAt > 0 && now - this.lastVoiceAt < 5000 ? this.lastVoiceAt : now;
        this.sendUtterance(text, "voice", speechEnd, now);
      },
      onError: (message: string) => this.set({ notice: message }),
    };

    const res = await fetch("/api/stt-token", { method: "POST" });
    const first = await res.json();
    if (!res.ok) throw new Error(first.error ?? `STT token error ${res.status}`);
    if (first.mode === "webspeech") return new WebSpeechStt(handlers);

    // 1 回目は取得済みのトークンを使い、再接続時は取り直す
    let prefetched: typeof first | null = first;
    return new GeminiLiveStt(async () => {
      if (prefetched) {
        const t = prefetched;
        prefetched = null;
        return t;
      }
      const r = await fetch("/api/stt-token", { method: "POST" });
      if (!r.ok) throw new Error(`STT token error ${r.status}`);
      return r.json();
    }, handlers);
  }

  private sendUtterance(text: string, source: Turn["source"], speechEnd: number, sttFinal: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.set({ notice: "通話を開始してください" });
      return;
    }
    // 前のターンの再生が残っていれば止める
    this.player?.stop();
    this.speaker?.stop();

    const turnId = this.nextTurnId++;
    this.currentTurnId = turnId;
    this.inFlight = true;
    this.setSttPaused(true);
    this.set({
      status: "thinking",
      turns: [
        ...this.snapshot.turns,
        {
          turnId,
          source,
          userText: text,
          assistantText: "",
          times: { speechEnd, sttFinal },
          serverMarks: {},
          done: false,
        },
      ],
    });
    this.send({ type: "user_utterance", turnId, text });
  }

  private onServerMessage(msg: ServerMessage) {
    if (msg.type === "error" && msg.turnId === undefined) {
      this.set({ notice: msg.message });
      return;
    }
    if (!("turnId" in msg) || msg.turnId !== this.currentTurnId) return;
    const now = performance.now();

    switch (msg.type) {
      case "route":
        this.updateTurn(msg.turnId, (t) => ({
          ...t,
          route: {
            kind: msg.kind,
            topicTitle: msg.topicTitle,
            confidence: msg.confidence,
            candidates: (msg.candidates ?? []).map((c) => ({ title: c.title, probability: c.probability })),
          },
          times: { ...t.times, route: now },
        }));
        break;
      case "assistant_delta":
        this.updateTurn(msg.turnId, (t) => ({
          ...t,
          assistantText: t.assistantText + msg.text,
          times: { ...t.times, firstText: t.times.firstText ?? now },
        }));
        break;
      case "speech_chunk":
        if (msg.browserTts) {
          const turnId = msg.turnId;
          this.speaker?.speak(msg.text, () => this.markFirstAudio(turnId, performance.now()));
        }
        break;
      case "metrics":
        this.updateTurn(msg.turnId, (t) => ({ ...t, serverMarks: msg.marks }));
        break;
      case "error":
        this.updateTurn(msg.turnId, (t) => ({ ...t, error: msg.message }));
        break;
      case "turn_end":
        this.inFlight = false;
        this.updateTurn(msg.turnId, (t) => ({ ...t, done: true }));
        break;
    }
  }

  private onAudio(buf: ArrayBuffer) {
    const frame = decodeAudioFrame(buf);
    if (frame.turnId !== this.currentTurnId || !this.player) return;
    const startAt = this.player.enqueue(frame.pcm);
    if (startAt !== null) this.markFirstAudio(frame.turnId, startAt);
  }

  private markFirstAudio(turnId: number, at: number) {
    const turn = this.snapshot.turns.find((t) => t.turnId === turnId);
    if (!turn || turn.times.firstAudio !== undefined) return;
    this.updateTurn(turnId, (t) => ({ ...t, times: { ...t.times, firstAudio: at } }));
  }

  /** 100ms ごと：AI が応答中かどうかで STT の一時停止・再開を切り替える */
  private tick() {
    const now = performance.now();
    const playing = Boolean(this.player?.isPlaying || this.speaker?.isSpeaking);
    if (this.inFlight || playing) {
      this.lastBusyAt = now;
      this.setSttPaused(true);
      const status: CallStatus = playing ? "speaking" : "thinking";
      if (this.snapshot.status !== status) this.set({ status });
    } else if (this.sttPaused && now - this.lastBusyAt >= RESUME_GAP_MS) {
      this.setSttPaused(false);
      this.set({ status: "listening" });
    }
  }

  private setSttPaused(paused: boolean) {
    if (this.sttPaused === paused) return;
    this.sttPaused = paused;
    this.stt?.setPaused(paused);
    if (paused) {
      this.inSpeech = false;
      this.voicedRun = 0;
    }
  }

  /** 音量ベースの簡易 VAD。発話終了時刻の計測と Hybrid VAD に使う */
  private detectSpeech(rms: number, at: number) {
    if (this.sttPaused) return;
    const threshold = Math.max(0.015, this.noiseFloor * 3);
    if (rms > threshold) {
      this.lastVoiceAt = at;
      if (++this.voicedRun >= 2) this.inSpeech = true;
      return;
    }
    this.voicedRun = 0;
    this.noiseFloor += (rms - this.noiseFloor) * 0.05;
    if (this.inSpeech && at - this.lastVoiceAt >= HYBRID_SILENCE_MS) {
      this.inSpeech = false;
      if (this.snapshot.hybridVad) this.stt?.endOfSpeech();
    }
  }

  private send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
