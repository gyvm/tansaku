# Design-Tansaku プロジェクト技術スタック・ガイド

## 概要

Design-Tansaku は複数の独立したデザインプロジェクトを **統合管理するモノレポ** です。
従来の各プロジェクト個別の npm 管理から、トップレベルの単一 Vite サーバーで全プロジェクトを効率的に管理できるように進化しました。

**主な利点：**
- 🚀 単一のサーバー起動で全プロジェクトにアクセス
- 📦 統一された技術スタックと依存パッケージ管理
- 🔗 URL パスで直感的にプロジェクト切り替え
- 🎯 各プロジェクトは完全に独立（スタイル・コンポーネント・ガイドラインを共有しない）
- ⚡ 効率的なビルド・デプロイ

---

## 推奨技術スタック

### コアテクノロジー

- **React 18.3.1** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite 6.3.5** - 高速ビルドツール
- **Tailwind CSS 3.3.6** - ユーティリティベースのスタイリング
- **React Router v6** - クライアント側ルーティング

### UIコンポーネント

- **Radix UI** (30+ ライブラリ) - アクセシビリティ考慮済みベースコンポーネント
  - react-accordion, react-alert-dialog, react-avatar, react-button など
- **class-variance-authority** - コンポーネントのバリアント管理
- **tailwind-merge** - Tailwind クラスマージング
- **clsx** - 条件付きクラス名生成

### その他のライブラリ

- **lucide-react** - アイコンライブラリ (487+ アイコン)
- **react-hook-form** - フォーム状態管理
- **recharts** - チャート/グラフ
- **sonner** - トースト通知
- **next-themes** - テーマ切り替え
- **react-day-picker** - 日付ピッカー
- **embla-carousel-react** - カルーセル
- **react-resizable-panels** - リサイズ可能なパネル
- **cmdk** - コマンドパレット

---

## プロジェクト構造の進化

### レガシー構造（個別 npm 管理）

```
design-tansaku/
├── macOS_ComponentLibraryDesign_Figma/
│   ├── src/
│   ├── package.json          ← 個別管理
│   ├── vite.config.ts
│   └── ...
├── macOS_SettingsWindowDesign_Figma/
│   ├── src/
│   ├── package.json          ← 個別管理
│   ├── vite.config.ts
│   └── ...
├── auralog-design/
│   ├── src/
│   ├── package.json          ← 個別管理
│   └── ...
└── ...
```

**課題：**
- ❌ 複数の npm サーバー起動が必要
- ❌ 依存パッケージ管理が分散
- ❌ ビルド・デプロイが複雑

---

### 新統合構造（モノレポ）

```
design-tansaku/
├── src/
│   ├── pages/
│   │   ├── component-library/        # macOS Component Library Design
│   │   │   ├── App.tsx               # 各プロジェクトのエントリーポイント
│   │   │   ├── components/           # プロジェクト固有のコンポーネント
│   │   │   │   ├── ui/               # (40+ Radix UIベース)
│   │   │   │   ├── buttons.tsx
│   │   │   │   ├── containers.tsx
│   │   │   │   ├── information.tsx
│   │   │   │   ├── inputs.tsx
│   │   │   │   └── navigation.tsx
│   │   │   ├── styles/               # プロジェクト固有のスタイル
│   │   │   │   └── globals.css
│   │   │   └── guidelines/
│   │   │       └── Guidelines.md     # デザインガイドライン
│   │   │
│   │   ├── settings-window/          # macOS Settings Window Design
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   │
│   │   ├── auralog/                  # Auralog Design System
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   │
│   │   ├── typozero/                 # TypoZero Design
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   │
│   │   ├── appbooks/                 # macOS Apple Books Style
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   │
│   │   ├── Home.tsx                  # プロジェクト選択画面
│   │   └── NotFound.tsx              # 404ページ
│   │
│   ├── styles/
│   │   └── globals.css               # グローバルスタイル（全プロジェクト共通）
│   │
│   └── main.tsx                      # React Router v6 ルーティング
│
├── index.html
├── package.json                       # ← トップレベル統合管理
├── vite.config.ts                     # ← トップレベル統合設定
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── ...
```

**メリット：**
- ✅ 単一の npm サーバー起動：`npm run dev`
- ✅ 統一された依存パッケージ管理
- ✅ 効率的なビルド・デプロイ
- ✅ URL パスで直感的な切り替え

---

## React Router v6 ルーティング

### URL マッピング

| パス | コンポーネント | ファイル | 説明 |
|------|-------------|--------|------|
| `/` | Home | `src/pages/Home.tsx` | プロジェクト選択画面 |
| `/component-library` | ComponentLibraryApp | `src/pages/component-library/App.tsx` | macOS Component Library |
| `/settings-window` | SettingsWindowApp | `src/pages/settings-window/App.tsx` | macOS Settings Window |
| `/auralog` | AuralogApp | `src/pages/auralog/App.tsx` | Auralog Design System |
| `/typozero` | TypoZeroApp | `src/pages/typozero/App.tsx` | TypoZero |
| `/appbooks` | AppBooksApp | `src/pages/appbooks/App.tsx` | macOS Apple Books Style |
| `*` | NotFound | `src/pages/NotFound.tsx` | 404ページ |

### ルーティング設定（src/main.tsx）

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/component-library" element={<ComponentLibraryApp />} />
        <Route path="/settings-window" element={<SettingsWindowApp />} />
        <Route path="/auralog" element={<AuralogApp />} />
        <Route path="/typozero" element={<TypoZeroApp />} />
        <Route path="/appbooks" element={<AppBooksApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## トップレベル設定ファイル

### package.json（トップレベル）

すべてのプロジェクトで共有される依存パッケージをここで管理します。
新規プロジェクトを追加する際も、追加の `npm install` は **不要** です（既に必要な packages がすべてインストール済み）。

```json
{
  "name": "design-tansaku",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0",
    "@radix-ui/react-*": "...",
    "tailwind-merge": "*",
    "lucide-react": "^0.487.0",
    // ... その他多数
  },
  "scripts": {
    "dev": "vite",           // ← 全プロジェクト起動
    "build": "vite build",   // ← 全プロジェクトビルド
    "preview": "vite preview"
  }
}
```

### vite.config.ts（トップレベル）

単一の Vite 設定で全プロジェクトをビルドします。
各プロジェクトに個別の `vite.config.ts` は **不要** です。

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
```

### tailwind.config.js（トップレベル）

すべてのプロジェクトにスタイルが適用されます。

```js
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',  // ← src/ 配下全体をスキャン
  ],
  // ... 共通設定
};
```

---

## 新規デザイン追加ガイド

新規デザインプロジェクトを追加する場合は、以下の手順に従ってください。

### 前提条件

- Node.js 16+ がインストール済み
- `npm install` は既に実行済み（追加不要）
- 推奨技術スタック（React, TypeScript, Tailwind CSS など）を使用

### ステップバイステップ手順

#### Step 1: ディレクトリ構造を作成

```bash
# src/pages/ 配下に新規プロジェクトディレクトリを作成
mkdir -p src/pages/[design-name]/components/ui
mkdir -p src/pages/[design-name]/styles
mkdir -p src/pages/[design-name]/guidelines

# 例：新規デザイン「my-new-design」の場合
mkdir -p src/pages/my-new-design/components/ui
mkdir -p src/pages/my-new-design/styles
mkdir -p src/pages/my-new-design/guidelines
```

#### Step 2: App.tsx を実装

`src/pages/[design-name]/App.tsx` にメインのコンポーネントを実装します。
**重要：** `export default` で関数をエクスポートしてください。

```tsx
// src/pages/my-new-design/App.tsx
import React from 'react';

export default function MyNewDesignApp() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">My New Design</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <p>Design content here...</p>
      </main>
    </div>
  );
}
```

#### Step 3: コンポーネント・スタイルを配置

プロジェクト固有のコンポーネントとスタイルを配置します。

```
src/pages/my-new-design/
├── App.tsx
├── components/
│   ├── ui/                      # Radix UI ベースコンポーネント（40+）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── buttons.tsx              # ボタン関連
│   ├── containers.tsx           # コンテナ/レイアウト
│   ├── information.tsx          # 情報表示系
│   ├── inputs.tsx               # 入力フォーム系
│   └── navigation.tsx           # ナビゲーション系
├── styles/
│   └── globals.css              # このプロジェクト専用スタイル
└── guidelines/
    └── Guidelines.md            # デザインガイドライン
```

#### Step 4: src/main.tsx に新規ルートを追加

```tsx
// src/main.tsx

// 既存のインポート
import Home from './pages/Home';
import ComponentLibraryApp from './pages/component-library/App';
// ... 他の既存プロジェクト

// 新規プロジェクトのインポートを追加
import MyNewDesignApp from './pages/my-new-design/App';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 既存ルート */}
        <Route path="/component-library" element={<ComponentLibraryApp />} />
        
        {/* 新規ルートをここに追加 */}
        <Route 
          path="/my-new-design" 
          element={
            <ProjectLayout>
              <MyNewDesignApp />
            </ProjectLayout>
          } 
        />
        
        {/* 404ページ */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Step 5: Home.tsx にプロジェクト情報を追加

`src/pages/Home.tsx` のプロジェクト一覧に新規プロジェクトを追加します。

```tsx
// src/pages/Home.tsx

const projects: ProjectCard[] = [
  // 既存プロジェクト...
  
  // 新規プロジェクトをここに追加
  {
    id: 'my-new-design',
    name: 'My New Design',
    description: 'Description of your new design system.',
    path: '/my-new-design',
    icon: <Palette className="w-6 h-6" />,  // 適切なアイコンを選択
    color: 'from-cyan-500 to-cyan-600',      // グラデーション色を指定
    status: 'completed',                      // 'completed' | 'in-progress' | 'planned'
  },
];
```

**カラーオプション例：**
```
'from-blue-500 to-blue-600'       // ブルー系
'from-purple-500 to-purple-600'   // パープル系
'from-indigo-500 to-indigo-600'   // インディゴ系
'from-green-500 to-green-600'     // グリーン系
'from-pink-500 to-pink-600'       // ピンク系
'from-amber-500 to-amber-600'     // アンバー系
```

#### Step 6: ローカルで動作確認

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで確認
# http://localhost:5173/my-new-design
```

#### Step 7: Git にコミット

```bash
# 変更をステージ
git add src/pages/my-new-design/ src/main.tsx src/pages/Home.tsx

# コミット
git commit -m "feat: Add My New Design project to monorepo

- Create src/pages/my-new-design/ with App.tsx structure
- Add routing in src/main.tsx
- Add project card to Home.tsx
- Design is accessible at /my-new-design"
```

---

## URL 命名規則と設計ガイドライン

### URL パス命名規則

- **形式：** kebab-case（すべて小文字、単語はハイフン区切り）
- **例：**
  - ✅ `/my-new-design`
  - ✅ `/settings-window`
  - ✅ `/component-library`
  - ❌ `/MyNewDesign` （❌ PascalCase は使用禁止）
  - ❌ `/my_new_design` （❌ snake_case は使用禁止）

### ディレクトリ名命名規則

- **形式：** kebab-case
- **場所：** `src/pages/[design-name]/`
- **例：** `src/pages/my-new-design/`

### App.tsx 関数名命名規則

- **形式：** PascalCase + 「App」サフィックス
- **例：**
  ```tsx
  export default function MyNewDesignApp() { ... }
  export default function ComponentLibraryApp() { ... }
  ```

### ホーム画面プロジェクトカードの ID

- **形式：** kebab-case（URL パスと一致させる）
- **例：**
  ```tsx
  {
    id: 'my-new-design',      // ← URL パスと同じ
    path: '/my-new-design',   // ← 一致すること
    // ...
  }
  ```

---

## プロジェクト独立性に関する重要な注意事項

### ✅ やるべきこと

各プロジェクトは **完全に独立** しています。以下の構造が保証されています：

```
src/pages/[design-name]/
├── App.tsx                   # このプロジェクト専用のエントリーポイント
├── components/               # このプロジェクト専用のコンポーネント
│   ├── ui/                   # Radix UI ベース（各プロジェクトで独立）
│   ├── buttons.tsx
│   └── ...
└── styles/                   # このプロジェクト専用のスタイル
    └── globals.css
```

#### コンポーネントの実装（プロジェクト内）

```tsx
// ✅ 正しい：同じプロジェクト内のコンポーネントをインポート
import { MyButton } from '../components/buttons';
import { Card } from '../components/ui/card';

export default function MyNewDesignApp() {
  return <MyButton>Click me</MyButton>;
}
```

### ❌ やってはいけないこと

#### 1. 他プロジェクトのコンポーネントをインポート

```tsx
// ❌ 間違い：他プロジェクトからインポート
import { Button } from '../auralog/components/ui/button';

// ❌ 間違い：別プロジェクトのスタイルを使用
import '../settings-window/styles/globals.css';
```

**理由：** 各プロジェクトは独立した設計哲学を持つため、スタイル・コンポーネントを共有すると矛盾が生じます。

#### 2. グローバルスタイルの共有

```tsx
// ❌ 間違い：他プロジェクトのスタイルをインポート
import '../component-library/styles/globals.css';
```

**理由：** Tailwind CSS のグローバルスタイルは `src/styles/globals.css` のみで管理します。

#### 3. グローバル CSS の改変（グローバルに影響しないよう注意）

```css
/* src/styles/globals.css では、すべてのプロジェクトに適用される */
/* 特定プロジェクト専用のスタイルは src/pages/[design-name]/styles/globals.css に記載 */
```

---

## 実装例：新規プロジェクト追加（完全例）

実際に新規プロジェクト「**Portfolio Design**」を追加する例を示します。

### 1. ディレクトリ作成

```bash
mkdir -p src/pages/portfolio-design/components/ui
mkdir -p src/pages/portfolio-design/styles
mkdir -p src/pages/portfolio-design/guidelines
```

### 2. App.tsx 実装

```tsx
// src/pages/portfolio-design/App.tsx
import React from 'react';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

export default function PortfolioDesignApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* ヘッダー */}
      <header className="border-b border-slate-700/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Portfolio Design</h1>
          <p className="text-slate-400 text-sm">Clean, minimal portfolio theme</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* ヒーローセクション */}
        <section className="space-y-4">
          <p className="text-slate-400 text-sm uppercase tracking-wide">About</p>
          <h2 className="text-4xl font-bold">Full-Stack Designer & Developer</h2>
          <p className="text-slate-300 text-lg max-w-2xl">
            Focused on creating clean, user-centric design systems. 
            This portfolio showcases a minimal, modern aesthetic.
          </p>
        </section>

        {/* プロジェクトギャラリー */}
        <section className="space-y-4">
          <p className="text-slate-400 text-sm uppercase tracking-wide">Projects</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="group rounded-lg border border-slate-700/50 overflow-hidden hover:border-slate-600 transition"
              >
                <div className="aspect-video bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-500">Project {num}</span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold">Project Title {num}</h3>
                  <p className="text-sm text-slate-400">Description here.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
```

### 3. src/main.tsx にルートを追加

```tsx
import PortfolioDesignApp from './pages/portfolio-design/App';

<Route
  path="/portfolio-design"
  element={
    <ProjectLayout>
      <PortfolioDesignApp />
    </ProjectLayout>
  }
/>
```

### 4. Home.tsx にプロジェクト情報を追加

```tsx
{
  id: 'portfolio-design',
  name: 'Portfolio Design',
  description: 'Clean, minimal portfolio theme with focus on typography.',
  path: '/portfolio-design',
  icon: <Briefcase className="w-6 h-6" />,
  color: 'from-slate-600 to-slate-700',
  status: 'completed',
},
```

---

## 実装チェックリスト

新規プロジェクトを追加した際は、以下のチェックリストを確認してください。

```
新規デザイン「[design-name]」の追加チェックリスト

プロジェクト構造
[ ] src/pages/[design-name]/ ディレクトリ作成済み
[ ] App.tsx が export default で実装されている
[ ] components/ui/ ディレクトリが存在
[ ] styles/ ディレクトリが存在
[ ] guidelines/ ディレクトリが存在（Guidelines.md を推奨）

コンポーネント実装
[ ] 他プロジェクトのコンポーネントをインポートしていない
[ ] Radix UI / Tailwind CSS を正しく使用
[ ] TypeScript の型定義が完全

ルーティング設定
[ ] src/main.tsx に新規 Route を追加済み
[ ] URL パスが kebab-case（例：/my-new-design）
[ ] App.tsx 関数名が PascalCase + App（例：MyNewDesignApp）

ホーム画面
[ ] src/pages/Home.tsx に ProjectCard を追加
[ ] プロジェクトの id, path, name が一貫性あり
[ ] icon, color, status が適切に設定

動作確認
[ ] npm run dev で localhost:5173 にアクセス
[ ] ホーム画面にプロジェクトが表示される
[ ] /[design-name] パスでプロジェクトにアクセス可能
[ ] ホーム画面に戻ることが可能（Link 機能）

Git コミット
[ ] git add で必要なファイルをステージ
[ ] 意味のあるコミットメッセージを作成
[ ] git commit で変更を確定
```

---

## よくある質問（FAQ）

### Q1: 複数プロジェクト間でコンポーネントを共有したい

**A:** 各プロジェクトは独立した設計哲学を持つため、コンポーネント共有は意図的に制限されています。

**代替案：**
1. **各プロジェクトで独立実装** - 推奨（設計の一貫性を保つ）
2. **`src/shared/` の検討** - 将来的な拡張として検討中

現在は、各プロジェクトで必要なコンポーネントを独立して実装してください。

---

### Q2: グローバルスタイルをカスタマイズしたい

**A:** グローバルスタイルには 2 つのレベルがあります：

#### すべてのプロジェクトに適用するスタイル
```css
/* src/styles/globals.css を編集 */
/* 全プロジェクトに影響するため、慎重に */
```

#### 特定プロジェクトのみに適用するスタイル
```css
/* src/pages/[design-name]/styles/globals.css を編集 */
/* このプロジェクトのみに影響 */
```

---

### Q3: 新しい npm パッケージを追加したい

**A:** トップレベルで npm をインストールしてください：

```bash
# トップレベルで実行
npm install [package-name]

# package.json が自動更新される
# すべてのプロジェクトでパッケージが利用可能
```

**注意：** 各プロジェクトディレクトリでの `npm install` は避けてください。

---

### Q4: 開発サーバーがポート 5173 以外で起動したい

**A:** 以下のコマンドで別ポートを指定できます：

```bash
npm run dev -- --port 5174
```

---

### Q5: ビルド出力をカスタマイズしたい

**A:** `vite.config.ts` の `build` セクションを編集してください：

```ts
export default defineConfig({
  build: {
    outDir: 'dist',        // 出力ディレクトリ
    minify: 'terser',      // ミニファイオプション
    sourcemap: false,      // ソースマップ生成
  },
});
```

---

### Q6: 既存プロジェクトを削除したい

**A:** 以下のファイルを修正してください：

1. `src/pages/[design-name]/` ディレクトリを削除
2. `src/main.tsx` からルートを削除
3. `src/pages/Home.tsx` からプロジェクトカードを削除
4. コミット

```bash
rm -rf src/pages/[design-name]
# 次に src/main.tsx と src/pages/Home.tsx を編集
git add -A
git commit -m "feat: Remove [design-name] project from monorepo"
```

---

## 命名規則

### ファイル名

- **形式：** kebab-case（すべて小文字、単語はハイフン区切り）
- **例：**
  - ✅ `my-component.tsx`
  - ✅ `use-mobile.ts`
  - ✅ `button.tsx`

### コンポーネント関数名

- **形式：** PascalCase
- **例：**
  - ✅ `export function MyComponent() { ... }`
  - ✅ `export default function MyComponentApp() { ... }`

### CSS クラス

- **形式：** Tailwind CSS utilities（組み込みのみ）
- **例：**
  - ✅ `className="px-4 py-2 bg-blue-600 rounded"`

### 変数名

- **形式：** camelCase
- **例：**
  - ✅ `const myVariable = ...`
  - ✅ `const isActive = ...`

---

## スタイリング方針

### 1. Tailwind CSS（ベース）

すべてのスタイルは Tailwind CSS のユーティリティクラスを使用します。

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Click me
</button>
```

### 2. class-variance-authority (CVA)（バリアント管理）

コンポーネントのバリアント（variant、size など）は CVA で管理します。

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/components/ui/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### 3. tailwind-merge（クラス競合回避）

`cn` ユーティリティを使用して、Tailwind クラスの競合を自動解決します。

```tsx
import { cn } from "@/components/ui/utils"

// className="px-8" は className="px-4" をオーバーライド
<div className={cn("px-4 py-2", "px-8")} /> // px-8 が適用される
```

---

## Radix UI の使用方法

### 原則

全コンポーネントは以下の原則に従います：

- **アクセシビリティ**: ARIA属性が自動付与されている
- **キーボード操作**: Tab、Enter、Space、Arrow キーに完全対応
- **カスタマイズ性**: `asChild` prop で別の要素にマップ可能
- **スタイリング**: className で Tailwind クラスを追加可能

### 使用例

```tsx
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

export function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Open Dialog
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">Dialog Title</Dialog.Title>
          <Dialog.Description className="mt-2 text-gray-600">
            Dialog description goes here.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 p-1">
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

---

## プロジェクト一覧と現在のステータス

| プロジェクト | 説明 | URL | ステータス |
| --- | --- | --- | --- |
| Component Library | macOS Component Library Design | `/component-library` | ✅ 完了 |
| Settings Window | macOS Settings Window Design | `/settings-window` | ✅ 完了 |
| Auralog | Auralog Design System | `/auralog` | ✅ 完了 |
| TypoZero | TypoZero Settings Layout | `/typozero` | ✅ 完了 |
| Apple Books Style | macOS Apple Books Style | `/appbooks` | ✅ 完了 |

---

## 開発フロー

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/[user]/design-tansaku.git
cd design-tansaku

# 依存パッケージをインストール（一度だけ）
npm install

# 開発サーバー起動（全プロジェクト動作）
npm run dev
```

### ブラウザで確認

```
http://localhost:5173/              # ホーム
http://localhost:5173/component-library   # Component Library
http://localhost:5173/settings-window     # Settings Window
http://localhost:5173/auralog            # Auralog
http://localhost:5173/typozero           # TypoZero
http://localhost:5173/appbooks           # Apple Books Style
```

### ビルド

```bash
# 本番環境用ビルド
npm run build

# dist/ に出力される
```

### ビルド確認

```bash
# ビルド結果をローカルプレビュー
npm run preview
```

---

## トラブルシューティング

### npm install エラー

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Vite 開発サーバーが起動しない

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

### Tailwind CSS が適用されない

`tailwind.config.js` の `content` が正しく設定されているか確認：

```js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### ポート 5173 が既に使用中

```bash
npm run dev -- --port 5174
```

---

## 参考リンク

- [React Documentation](https://react.dev/)
- [React Router v6 Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [class-variance-authority](https://cva.style/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## サポート・フィードバック

質問や問題がある場合は、GitHub Issues で報告してください。
改善提案もお待ちしています。
