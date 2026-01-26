# Design-Tansaku プロジェクト構造分析

## 現在の構成 (2025-11-29)

### ディレクトリ一覧
1. **auralog-design** - HTML/CSS ベース（静的サイト）
   - index.html, components.html, documentation.html
   - design-system.css
   - screens/ サブディレクトリ

2. **macOS_BasedAppleBooksStyle_Gemini** - HTML/CSS ベース（静的サイト）
   - index.html, styles.css のみ

3. **macOS_ComponentLibraryDesign_Figma** - React + TypeScript（推奨スタック）
   - src/ (components, styles, guidelines)
   - package.json, vite.config.ts
   - README.md
   - Radix UI + Tailwind CSS ベース

4. **macOS_SettingsWindowDesign_Figma** - React + TypeScript
   - src/ (components, styles, guidelines)
   - package.json, vite.config.ts
   - README.md
   - Radix UI + Tailwind CSS ベース

5. **macOS_TypoZero_ChatGPT** - HTML/CSS ベース（静的サイト）
   - index.html, *.css ファイル複数

## 推奨スタック（macOS_ComponentLibraryDesign_Figma から）
- React 18.3.1 + TypeScript
- Vite 6.3.5 (ビルドツール)
- Radix UI (30+)
- Tailwind CSS
- クラス管理: class-variance-authority, tailwind-merge
- その他: lucide-react, react-hook-form, sonner など

## 統一化の計画
- HTML/CSS ベースのプロジェクトを React + TypeScript に移行
- 全プロジェクトで同じ技術スタックを使用
- AGENTS.md に全プロジェクトの技術スタック説明を記載
