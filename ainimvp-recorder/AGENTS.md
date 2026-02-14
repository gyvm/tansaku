# AIniMVP Recorder 開発ガイド

# バージョン管理 (mise)

このプロジェクトは monorepo 直下の `AGENTS.md` に従います。

## 開発コマンド
- UI起動: npm run dev (vite)

## UI表示チェック (Playwright)
- このツールは常駐プロセスを起動できないため、UIは手動で起動する
- 起動後に `http://localhost:5173` などのURLを共有して表示チェックを実施
