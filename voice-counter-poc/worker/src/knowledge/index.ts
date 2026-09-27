// ナレッジベース（ダミー）。1 トピック = 1 Markdown ファイル。
// wrangler の Text モジュールルール（wrangler.jsonc の rules）で .md を文字列として import している。
// トピックを増やすときは .md を追加して下の配列に 1 行足す。
import gomi from "./gomi.md";
import inkan from "./inkan.md";
import jidouteate from "./jidouteate.md";
import juminhyo from "./juminhyo.md";
import kokuho from "./kokuho.md";
import koseki from "./koseki.md";
import madoguchi from "./madoguchi.md";
import mynumber from "./mynumber.md";
import tenkyo from "./tenkyo.md";
import tennyu from "./tennyu.md";
import tenshutsu from "./tenshutsu.md";
import zeishomei from "./zeishomei.md";

export interface Topic {
  id: string;
  title: string;
  category: string;
  /** Jev の選択肢の説明（criteria）に使う */
  description: string;
  /** Jev 判定直後に即読み上げる復唱フレーズ */
  ack: string;
  /** STT のカスタム語彙とモック分類器に使う */
  keywords: string[];
  /** LLM に渡す本文 */
  body: string;
}

const SOURCES = [
  juminhyo,
  tennyu,
  tenshutsu,
  tenkyo,
  mynumber,
  inkan,
  koseki,
  kokuho,
  jidouteate,
  gomi,
  zeishomei,
  madoguchi,
];

/** "---" で囲まれた簡易フロントマター（key: value の 1 行形式のみ）をパースする */
export function parseTopic(source: string): Topic {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error("knowledge file is missing front matter");
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  for (const key of ["id", "title", "category", "description", "ack"]) {
    if (!meta[key]) throw new Error(`knowledge file is missing "${key}"`);
  }
  return {
    id: meta.id,
    title: meta.title,
    category: meta.category,
    description: meta.description,
    ack: meta.ack,
    keywords: (meta.keywords ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    body: match[2].trim(),
  };
}

export const TOPICS: readonly Topic[] = SOURCES.map(parseTopic);

const byId = new Map(TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): Topic | undefined {
  return byId.get(id);
}

/** STT のカスタム語彙（公式ドキュメントでは 100 語程度までが推奨） */
export function customVocabulary(limit = 100): string[] {
  return [...new Set(TOPICS.flatMap((t) => t.keywords))].slice(0, limit);
}
