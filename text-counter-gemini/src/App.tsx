import { useMemo, useState } from "react";

type StatsItem = {
  label: string;
  value: string;
};

const wordPattern = /[\p{L}\p{N}]+/gu;

function countSentences(value: string): number {
  const matches = value.match(/[^.!?。！？\n]+[.!?。！？]?/g);
  return matches?.filter((segment) => segment.trim().length > 0).length ?? 0;
}

function countParagraphs(value: string): number {
  if (!value.trim()) return 0;
  return value
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
}

function App() {
  const [text, setText] = useState("");
  const [proofreadText, setProofreadText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const stats = useMemo<StatsItem[]>(() => {
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, "").length;
    const words = text.match(wordPattern)?.length ?? 0;
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);
    const readMinutes = charactersNoSpace === 0 ? 0 : Math.max(1, Math.ceil(charactersNoSpace / 600));
    return [
      { label: "文字数", value: characters.toLocaleString("ja-JP") },
      { label: "空白除く文字数", value: charactersNoSpace.toLocaleString("ja-JP") },
      { label: "単語数", value: words.toLocaleString("ja-JP") },
      { label: "文の数", value: sentences.toLocaleString("ja-JP") },
      { label: "段落数", value: paragraphs.toLocaleString("ja-JP") },
      { label: "推定読了時間", value: `${readMinutes} 分` }
    ];
  }, [text]);

  const handleProofread = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      setErrorMessage("`VITE_GEMINI_API_KEY` が未設定です。`.env` に追加してください。");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: [
                      "以下の日本語文章を校正してください。",
                      "誤字脱字、文法、自然さを改善し、意味は変えないでください。",
                      "出力は校正後の本文のみを返してください。",
                      "",
                      trimmed
                    ].join("\n")
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2
            }
          })
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Gemini API request failed.");
      }

      const data: GeminiResponse = await response.json();
      const fixedText =
        data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() ?? "";

      if (!fixedText) {
        throw new Error("校正結果を取得できませんでした。モデル名やAPIキーを確認してください。");
      }

      setProofreadText(fixedText);
      setUpdatedAt(new Date().toLocaleString("ja-JP"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "校正中に不明なエラーが発生しました。";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyProofreadText = async () => {
    if (!proofreadText) return;
    await navigator.clipboard.writeText(proofreadText);
  };

  return (
    <div className="page">
      <div className="noise" aria-hidden />
      <div className="app-shell">
        <aside className="sidebar" aria-label="文章統計">
          <p className="sidebar-title">LIVE STATS</p>
          <ul className="stats-list">
            {stats.map((item) => (
              <li key={item.label} className="stat-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
          <p className="hint">左側は常時更新。入力するほど統計値が反映されます。</p>
        </aside>

        <main className="main-area">
          <section className="editor-card">
            <header className="section-header">
              <h1>文字数カウンター + AI校正</h1>
              <p>入力フォームを中心に配置。Geminiで日本語校正が可能です。</p>
            </header>

            <label htmlFor="source-text" className="label-text">
              文章入力
            </label>
            <textarea
              id="source-text"
              className="editor"
              placeholder="ここに文章を入力してください..."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />

            <div className="actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleProofread}
                disabled={isLoading || text.trim().length === 0}
              >
                {isLoading ? "校正中..." : "AI校正 (Gemini)"}
              </button>
              <span className="meta">
                APIキー: <code>VITE_GEMINI_API_KEY</code>
              </span>
            </div>
            {errorMessage && <p className="error-text">{errorMessage}</p>}
          </section>

          <section className="result-card" aria-live="polite">
            <header className="section-header tight">
              <h2>校正後の文章 (仮表示)</h2>
              <p>
                {updatedAt ? `最終更新: ${updatedAt}` : "まだ校正されていません。AI校正ボタンを押してください。"}
              </p>
            </header>

            <div className="result-box">
              {proofreadText ? (
                <p>{proofreadText}</p>
              ) : (
                <p className="placeholder">
                  校正結果の見せ方は検討中とのことなので、いまは「結果テキスト表示 + 入力へ反映」方式で実装しています。
                </p>
              )}
            </div>

            <div className="actions secondary">
              <button type="button" onClick={copyProofreadText} disabled={!proofreadText}>
                結果をコピー
              </button>
              <button type="button" onClick={() => setText(proofreadText)} disabled={!proofreadText}>
                入力欄へ反映
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
  }>;
};

export default App;
