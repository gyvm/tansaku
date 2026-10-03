import fs from "fs";
import path from "path";

export interface DocSection {
  heading: string;
  content: string;
}

export interface MunicipalDoc {
  filename: string;
  title: string;
  content: string;
  keywords: string[];
  sections: DocSection[];
}

export type AspectType = "requirements" | "location" | "timing" | "amount" | "general";

export function detectAspect(query: string): AspectType {
  const q = query.toLowerCase();
  if (/(何が必要|何がいる|持ち物|必要書類|提出書類|必要なもの|何を持|持ってく|持参)/.test(q)) {
    return "requirements";
  }
  if (/(どこ|場所|窓口|どこに行|届出先|受付場所|行けばいい)/.test(q)) {
    return "location";
  }
  if (/(いつ|時期|期間|期限|何時まで|時間|スケジュール|土日|夜間|平日)/.test(q)) {
    return "timing";
  }
  if (/(いくら|金額|支給額|費用|手数料|料金|もらえる)/.test(q)) {
    return "amount";
  }
  return "general";
}

export class DocumentSearchEngine {
  private docs: MunicipalDoc[] = [];

  constructor(docsDir: string) {
    this.loadDocs(docsDir);
  }

  private loadDocs(docsDir: string) {
    if (!fs.existsSync(docsDir)) {
      console.warn(`[Warning] Docs directory not found: ${docsDir}`);
      return;
    }

    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const fullPath = path.join(docsDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      const titleLine = lines.find((l) => l.startsWith("# ")) || file;
      const title = titleLine.replace(/^#\s*/, "").trim();

      // セクション構造の抽出
      const sections: DocSection[] = [];
      let currentHeading = "概要";
      let currentLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("## ")) {
          if (currentLines.length > 0) {
            sections.push({
              heading: currentHeading,
              content: currentLines.join("\n").trim()
            });
            currentLines = [];
          }
          currentHeading = line.replace(/^##\s*/, "").trim();
        } else if (!line.startsWith("# ")) {
          currentLines.push(line);
        }
      }
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join("\n").trim()
        });
      }

      // キーワード抽出（簡易的トークナイズ）
      const words = content
        .toLowerCase()
        .replace(/[#\-\*\(\)\:\n\r\t]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      this.docs.push({
        filename: file,
        title,
        content,
        keywords: Array.from(new Set(words)),
        sections
      });
    }

    console.log(`📚 [DocSearch] Loaded ${this.docs.length} municipal documents into memory.`);
  }

  /**
   * クエリに最も関連するドキュメントを検索（上位N件）
   */
  public search(query: string, topK = 2): MunicipalDoc[] {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return [];

    const scored: { doc: MunicipalDoc; score: number }[] = [];

    for (const doc of this.docs) {
      let score = 0;
      const lowerTitle = doc.title.toLowerCase();

      // 1. タイトルそのものがクエリに含まれている、またはクエリがタイトルに含まれている
      if (lowerTitle.includes(normalized) || normalized.includes(lowerTitle)) {
        score += 30;
      }

      // 2. ドキュメントの主要語句（タイトルから助詞・一般的な語を取り除いた核）がクエリに含まれるか
      const coreTitle = lowerTitle.replace(/(手続き|窓口|受付|交付|について|申請|登録|再設定|の|・)/g, " ").trim();
      for (const token of coreTitle.split(/\s+/)) {
        if (token.length >= 2 && normalized.includes(token)) {
          score += 20;
        }
      }

      // 3. スペースや記号で区切られたトークンの一致
      const queryParts = normalized.split(/[\s,、。！？\-\_]+/);
      for (const part of queryParts) {
        if (!part || part.length < 2) continue;
        if (lowerTitle.includes(part)) score += 10;
        if (doc.content.toLowerCase().includes(part)) score += 2;
      }

      // 4. 日本語 2文字バイグラムによる類似度
      const sampleQuery = normalized.slice(0, 40); // 処理速度のため最大40文字
      for (let i = 0; i < sampleQuery.length - 1; i++) {
        const bigram = sampleQuery.slice(i, i + 2);
        if (lowerTitle.includes(bigram)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ doc, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.doc);
  }

  /**
   * アスペクト（疑問詞）を考慮したセクション付き検索
   */
  public searchWithAspect(
    query: string,
    topK = 2
  ): { doc: MunicipalDoc; matchedSection?: DocSection; aspect: AspectType }[] {
    const aspect = detectAspect(query);
    const matchedDocs = this.search(query, topK);

    return matchedDocs.map((doc) => {
      let matchedSection: DocSection | undefined;

      if (aspect === "requirements") {
        matchedSection = doc.sections.find((s) => /書類|もの|方法|要件|持参/.test(s.heading));
      } else if (aspect === "location") {
        matchedSection = doc.sections.find((s) => /窓口|場所|届出先|受付/.test(s.heading));
      } else if (aspect === "timing") {
        matchedSection = doc.sections.find((s) => /時期|期間|スケジュール|時間|期限/.test(s.heading));
      } else if (aspect === "amount") {
        matchedSection = doc.sections.find((s) => /額|費用|手数料|料金/.test(s.heading));
      }

      // アスペクトに一致する特定セクションがなければ概要セクション、それもなければ最初のセクション
      if (!matchedSection) {
        matchedSection = doc.sections.find((s) => /概要/.test(s.heading)) || doc.sections[0];
      }

      return { doc, matchedSection, aspect };
    });
  }
}
