import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      // wrangler の Text ルールと同じく .md を文字列として読み込む
      name: "markdown-as-text",
      load(id) {
        if (id.endsWith(".md")) return `export default ${JSON.stringify(readFileSync(id, "utf8"))};`;
      },
    },
  ],
});
