import { type FormEvent, useState, useSyncExternalStore } from "react";
import { CallController, type CallStatus, type Turn } from "./callController";
import { fmtMs, latencyOf, percentile } from "./metrics";

const controller = new CallController();

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: "未接続",
  connecting: "接続中…",
  listening: "お話しください",
  thinking: "回答を準備中…",
  speaking: "応答中（割り込み不可）",
};

const TARGET_MS = 3000;

export function App() {
  const s = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [text, setText] = useState("");
  const active = s.status !== "idle" && s.status !== "connecting";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    controller.sendText(text.trim());
    setText("");
  };

  const e2e = s.turns.map((t) => latencyOf(t).endToEnd).filter((v): v is number => v !== undefined);

  return (
    <div className="app">
      <header>
        <h1>サンプル市役所 音声自動応答 <small>PoC</small></h1>
        <p className="lede">住民票・転入届・マイナンバーカード・ごみの出し方などについて、声で質問してください。</p>
      </header>

      <section className="call">
        <button
          className={`call-button ${active ? "on" : ""}`}
          onClick={() => (s.status === "idle" ? controller.start() : controller.stop())}
          disabled={s.status === "connecting"}
        >
          {s.status === "idle" ? "通話を開始" : s.status === "connecting" ? "接続中…" : "通話を終了"}
        </button>
        <div className={`status status-${s.status}`}>
          <span className="dot" />
          {STATUS_LABEL[s.status]}
        </div>
        <div className="meter" aria-label="マイク音量">
          <div style={{ width: `${Math.min(100, s.level * 400)}%` }} />
        </div>
        <p className="interim">{s.interim || " "}</p>
        {s.notice && <p className="notice">{s.notice}</p>}
      </section>

      <section className="modes">
        <Badge label="STT" value={s.sttLabel ?? "—"} />
        <Badge label="意図判定" value={s.modes ? (s.modes.router === "jev" ? "Jev" : "モック（キーワード）") : "—"} />
        <Badge label="回答生成" value={s.modes ? (s.modes.llm === "gemini" ? "Gemini" : "モック") : "—"} />
        <Badge label="TTS" value={s.modes ? (s.modes.tts === "gemini" ? "Gemini TTS" : "ブラウザ標準") : "—"} />
        <label className="toggle">
          <input type="checkbox" checked={s.hybridVad} onChange={(e) => controller.setHybridVad(e.target.checked)} />
          Hybrid VAD（無音 600ms で発話終了を通知・実験的）
        </label>
      </section>

      <section className="summary">
        <Stat label="発話終了→応答開始 P50" value={fmtMs(percentile(e2e, 50))} ok={(percentile(e2e, 50) ?? Infinity) <= TARGET_MS} />
        <Stat label="P90" value={fmtMs(percentile(e2e, 90))} ok={(percentile(e2e, 90) ?? Infinity) <= TARGET_MS} />
        <Stat label="ターン数" value={String(s.turns.length)} />
        <button className="link" onClick={() => controller.reset()} disabled={!active}>
          会話をリセット
        </button>
      </section>

      <section className="log">
        {s.turns.length === 0 && <p className="empty">まだ会話はありません。</p>}
        {s.turns.map((t) => (
          <TurnView key={t.turnId} turn={t} />
        ))}
      </section>

      <form className="text-input" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={active ? "テキストでも質問できます（例: 住民票はコンビニで取れますか）" : "通話を開始するとテキストでも質問できます"}
          disabled={!active}
        />
        <button disabled={!active || !text.trim()}>送信</button>
      </form>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  const lat = latencyOf(turn);
  const m = turn.serverMarks;
  const route = turn.route;
  return (
    <article className="turn">
      <div className="bubble user">
        <span className="who">{turn.source === "voice" ? "🎤 あなた" : "⌨️ あなた"}</span>
        {turn.userText}
      </div>
      <div className="bubble assistant">
        {route && (
          <span className={`route route-${route.kind}`}>
            {route.kind === "answer" && `${route.topicTitle}（${pct(route.confidence)}）`}
            {route.kind === "clarify" &&
              `聞き返し: ${route.candidates.map((c) => `${c.title} ${pct(c.probability)}`).join(" / ")}`}
            {route.kind === "out_of_scope" && "範囲外"}
          </span>
        )}
        {turn.assistantText || (turn.done ? "" : "…")}
        {turn.error && <span className="error">エラー: {turn.error}</span>}
      </div>
      <dl className="timing">
        <Timing label="発話終了→応答開始" value={lat.endToEnd} highlight />
        <Timing label="STT 確定待ち" value={lat.stt} />
        <Timing label="確定→応答開始" value={lat.afterStt} />
        <Timing label="Jev" value={m.routed} />
        <Timing label="LLM 初トークン" value={m.llmFirstToken} />
        <Timing label="TTS 初バイト" value={m.ttsFirstByte} />
      </dl>
    </article>
  );
}

function Timing({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  const cls = highlight && value !== undefined ? (value <= TARGET_MS ? "good" : "bad") : "";
  return (
    <div className={cls}>
      <dt>{label}</dt>
      <dd>{fmtMs(value)}</dd>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="badge">
      <b>{label}</b> {value}
    </span>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className={`stat ${ok === undefined || value === "—" ? "" : ok ? "good" : "bad"}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
