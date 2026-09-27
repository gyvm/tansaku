// Worker のエントリポイント。
//   POST /api/stt-token … ブラウザが Gemini Live（STT）に直接つなぐための一時トークンを発行
//   GET  /ws?sid=...     … 通話セッション（Durable Object）への WebSocket
//   それ以外             … web/dist の静的ファイル（本番デプロイ時）

import type { Env } from "./env";
import { customVocabulary } from "./knowledge";
import { CallSession } from "./session";

export { CallSession };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/stt-token" && request.method === "POST") {
      return createSttToken(env);
    }

    if (url.pathname === "/ws") {
      const sid = url.searchParams.get("sid");
      if (!sid || !/^[\w-]{8,64}$/.test(sid)) return new Response("invalid sid", { status: 400 });
      const stub = env.CALL_SESSION.get(env.CALL_SESSION.idFromName(sid));
      return stub.fetch(request);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/**
 * Gemini Live API 用の ephemeral token を発行する。
 * 本物の API キーはブラウザに渡さず、モデルと設定を固定した使い捨てトークンだけを渡す。
 * https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 *
 * 注意: このエンドポイント自体には認証をかけていない。公開 URL にデプロイする場合は
 * Cloudflare Access などで保護すること（トークン発行 = API 利用料が発生するため）。
 */
async function createSttToken(env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    // キー未設定 → ブラウザ標準の Web Speech API にフォールバックさせる
    return Response.json({ mode: "webspeech" });
  }

  const sttConfig = {
    responseModalities: ["TEXT"],
    inputAudioTranscription: {
      languageCodes: ["ja-JP"],
      customVocabulary: customVocabulary(),
    },
  };
  const now = Date.now();
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: `models/${env.STT_MODEL}`,
        config: sttConfig,
      },
    }),
  });
  if (!res.ok) {
    return Response.json(
      { error: `failed to create STT token (${res.status}): ${(await res.text()).slice(0, 300)}` },
      { status: 502 },
    );
  }
  const token = (await res.json()) as { name: string };
  return Response.json({ mode: "gemini", token: token.name, model: env.STT_MODEL, config: sttConfig });
}
