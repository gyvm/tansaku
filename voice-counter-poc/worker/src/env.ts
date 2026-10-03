export interface Env {
  CALL_SESSION: DurableObjectNamespace;
  ASSETS?: Fetcher;

  // secrets（.dev.vars / wrangler secret put）。未設定ならモックで動く
  GEMINI_API_KEY?: string;
  JEV_API_KEY?: string;

  // vars（wrangler.jsonc）
  STT_MODEL: string;
  LLM_MODEL: string;
  LLM_THINKING_LEVEL: string;
  TTS_MODEL: string;
  TTS_VOICE: string;
  TTS_STYLE: string;
  JEV_MODEL: string;
  /** これ未満の confidence なら聞き返す */
  ROUTE_CONFIDENCE_THRESHOLD: string;
}
