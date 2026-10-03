import { DocumentSearchEngine, MunicipalDoc } from "./doc_search.js";

export class GeminiDialogEngine {
  private apiKey: string;
  private model: string;
  private searchEngine: DocumentSearchEngine;
  private responseCache: Map<string, string> = new Map();

  constructor(apiKey: string, searchEngine: DocumentSearchEngine, model = "gemini-3.5-flash-lite") {
    this.apiKey = apiKey;
    this.searchEngine = searchEngine;
    this.model = model;
  }

  /**
   * 発話途中用のクッション相槌セリフ（15〜25文字）を生成
   * 結論は言わず、トピックの受容と共感のみを行う（超低遅延辞書 + フォールバック）
   */
  public async generatePrefixScript(
    userUtterance: string,
    conversationHistory: string[] = []
  ): Promise<{ speech: string; sourceDocs: string[] }> {
    const trimmed = userUtterance.trim();
    if (!trimmed) {
      return { speech: "はい、お伺いしております。", sourceDocs: [] };
    }

    // 1. 超低遅延（0ms）ルールベース相槌
    const lower = trimmed.toLowerCase();
    if (/児童手当/.test(lower)) {
      return { speech: "かしこまりました。児童手当のお手続きですね。", sourceDocs: ["22_child_allowance.md"] };
    }
    if (/保育園|こども園/.test(lower)) {
      return { speech: "保育園の入園についてですね。かしこまりました。", sourceDocs: ["23_nursery_application.md"] };
    }
    if (/子どもが生まれた|子供が生まれた|赤ちゃん|出産|出生/.test(lower)) {
      return { speech: "おめでとうございます！お子様のお手続きですね。", sourceDocs: ["16_birth_registration.md"] };
    }
    if (/暗証番号|ロック|暗証/.test(lower)) {
      return { speech: "マイナンバーカードの暗証番号についてですね。", sourceDocs: ["12_myna_pin_reset.md"] };
    }
    if (/住民票/.test(lower)) {
      return { speech: "はい、住民票のお手続きについてですね。", sourceDocs: ["01_resident_certificate.md"] };
    }
    if (/引越|引っ越|転入|転出|越して/.test(lower)) {
      return { speech: "お引越しのお手続きですね。ご案内いたします。", sourceDocs: ["06_moving_in_other_city.md"] };
    }
    if (/結婚|婚姻/.test(lower)) {
      return { speech: "ご結婚おめでとうございます！婚姻届のお手続きですね。", sourceDocs: ["14_marriage_registration.md"] };
    }
    if (/退職|国保|国民健康保険/.test(lower)) {
      return { speech: "国民健康保険のお手続きですね。かしこまりました。", sourceDocs: ["18_national_health_insurance_join.md"] };
    }
    if (/ごみ|ゴミ|大型|粗大/.test(lower)) {
      return { speech: "ごみの収集手続きですね。ご案内いたします。", sourceDocs: ["28_large_garbage_collection.md"] };
    }

    // 2. ルールにない場合は Gemini Flash Lite で短いクッションを生成
    const systemInstruction = `あなたは札幌市役所コールセンターのオペレーターです。市民がまだ話している途中です。
【厳格なルール】
1. 手続き内容の結論や窓口の案内は絶対に言わないでください。
2. 市民の言葉を受け止め、共感・相槌・確認の短いセリフ（15〜25文字以内）のみを出力してください。
3. 箇条書きや記号は使用せず、声に出すセリフのみにしてください。
例: 「かしこまりました。〜についてですね。」「はい、〜のお手続きですね。」`;

    const prompt = `市民が話している途中の言葉: "${trimmed}"
短い相槌・クッション言葉を出力してください:`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        text = text.replace(/[\*\#\-\_\[\]\(\)\"]/g, "").replace(/\n+/g, " ").trim();
        if (text) {
          return { speech: text, sourceDocs: [] };
        }
      }
    } catch {}

    return { speech: "はい、お伺いしております。", sourceDocs: [] };
  }

  /**
   * 発話終了時用の核心回答セリフ（Tier-2 Payload）を生成
   * クッション相槌は既に再生されているため、直接要点・結論から回答する
   */
  public async generatePayloadScript(
    userUtterance: string,
    conversationHistory: string[] = []
  ): Promise<{ speech: string; sourceDocs: string[] }> {
    const trimmed = userUtterance.trim();
    if (!trimmed) {
      return { speech: "ご用件についてご案内いたしますので、お気軽にお話しください。", sourceDocs: [] };
    }

    // セクション対応型 RAG
    const searchResults = this.searchEngine.searchWithAspect(trimmed, 2);
    const topResult = searchResults[0];

    let docContext = "";
    if (topResult) {
      const sectionInfo = topResult.matchedSection
        ? `【見出し: ${topResult.matchedSection.heading}】\n${topResult.matchedSection.content}`
        : topResult.doc.content.slice(0, 300);
      docContext = `【資料: ${topResult.doc.title}】\n${sectionInfo}`;
    }

    const systemInstruction = `あなたは札幌市役所コールセンターのオペレーターです。市民の質問全文に対して、提供された【市役所窓口資料】の該当見出しに基づいて回答してください。

【通話応答の厳格なルール】
1. 相槌や前置き（「かしこまりました」「お調べしました」等）は既に相手に伝えているため、一切含めず、質問に対する結論・要点から直接答えてください。
2. 長さは「1〜2文（50文字〜80文字以内）」に収めてください。
3. 箇条書き、記号、Markdown（*や#）、注釈は使わず、そのまま声に出して読むセリフのみを出力してください。
4. 資料の該当セクションの内容（必要書類や窓口、時期など）を正確に答えてください。`;

    const prompt = `【過去の会話の文脈】
${conversationHistory.slice(-2).join("\n") || "なし"}

【市役所窓口資料】
${docContext || "該当資料なし。"}

【市民の質問全文】
"${trimmed}"

前置き抜きの【核心回答セリフ（1〜2文）】のみを出力してください：`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 100 }
        })
      });

      if (!resp.ok) {
        throw new Error(`Gemini status ${resp.status}`);
      }

      const data = await resp.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      text = text.replace(/[\*\#\-\_\[\]\(\)\"]/g, "").replace(/\n+/g, " ").trim();

      if (!text) {
        text = "区役所の担当窓口、またはホームページの電子申請サービスからお手続きいただけます。";
      }

      return {
        speech: text,
        sourceDocs: topResult ? [topResult.doc.title] : []
      };
    } catch (err: any) {
      console.error("[Payload Gen Error]", err.message);
      return {
        speech: "区役所の窓口でお手続きいただけますので、本人確認書類をお持ちの上でお越しください。",
        sourceDocs: []
      };
    }
  }

  /**
   * 市民の発話から、関連ドキュメントを参照して電話口のセリフ（1〜2文）を生成（スタンドアロン用）
   */
  public async generateSpeechScript(
    userUtterance: string,
    conversationHistory: string[] = []
  ): Promise<{ speech: string; sourceDocs: string[] }> {
    const trimmed = userUtterance.trim();
    if (!trimmed) {
      return {
        speech: "はい、札幌市役所コールセンターです。ご用件をお伺いいたします。",
        sourceDocs: []
      };
    }

    // キャッシュチェック
    if (this.responseCache.has(trimmed)) {
      return {
        speech: this.responseCache.get(trimmed)!,
        sourceDocs: ["(キャッシュ)"]
      };
    }

    // セクション対応型検索
    const searchResults = this.searchEngine.searchWithAspect(trimmed, 2);
    const docContext = searchResults
      .map((r) => {
        const sec = r.matchedSection ? `\n【${r.matchedSection.heading}】\n${r.matchedSection.content}` : "";
        return `【${r.doc.title}】${sec}`;
      })
      .join("\n\n");

    const systemInstruction = `あなたは札幌市役所コールセンターのオペレーターです。市民からの電話口での相談に対し、提供された【市役所窓口資料】に基づいて回答してください。

【通話応答の厳格なルール】
1. 電話口で聞き取りやすいよう、簡潔な話し言葉・口語で答えてください。
2. 長さは必ず「1〜2文（60文字〜90文字以内）」に収めてください。長口舌は厳禁です。
3. 箇条書き、記号、Markdown（*や#）、カッコ、注釈は絶対に使わず、そのまま声に出して読むセリフのみを出力してください。
4. まず短い相槌や共感を入れ、次に要点を答えてください（例：「お調べいたしました。〜ですね」「かしこまりました。〜となります」）。
5. 資料にない推測や曖昧な回答は避け、「区役所の窓口でお手続きいただけます」など確実な案内をしてください。`;

    const prompt = `【過去の会話の文脈】
${conversationHistory.slice(-3).join("\n") || "なし"}

【市役所窓口資料】
${docContext || "該当資料なし。一般的な市役所窓口として丁寧に応答してください。"}

【市民の発話】
"${trimmed}"

電話口で市民に返す【1〜2文のセリフ】のみを出力してください：`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 120
          }
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`[Gemini Flash Error] status ${resp.status}:`, errText);
        return {
          speech: "お伺いいたしました。内容を確認いたしますので、具体的なご希望をもう少し詳しくお話しいただけますでしょうか？",
          sourceDocs: []
        };
      }

      const data = await resp.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      // 記号や改行の除去（きれいな音声セリフにする）
      text = text.replace(/[\*\#\-\_\[\]\(\)\"]/g, "").replace(/\n+/g, " ").trim();

      if (!text) {
        text = "承知いたしました。担当窓口を確認いたしますので、少々お待ちいただけますでしょうか。";
      }

      this.responseCache.set(trimmed, text);
      return {
        speech: text,
        sourceDocs: searchResults.map((r) => r.doc.title)
      };
    } catch (err: any) {
      console.error("[Gemini Error]", err.message);
      return {
        speech: "お電話ありがとうございます。内容を確認いたしますので、お伺いできますでしょうか。",
        sourceDocs: []
      };
    }
  }
}
