# Design Tansaku - 統合実装ガイド

## 概要

複数の独立したデザインプロジェクトを **単一の Vite サーバー** で統合管理できる構成に変更しました。

## 新しい構造

```
design-tansaku/
├── src/
│   ├── pages/
│   │   ├── component-library/        # macOS Component Library Design
│   │   │   ├── App.tsx
│   │   │   ├── components/           # (40+ UI components)
│   │   │   └── styles/
│   │   ├── settings-window/          # macOS Settings Window Design
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── auralog/                  # Auralog Design System
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── typozero/                 # TypoZero Design
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── appbooks/                 # macOS Apple Books Style
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── Home.tsx                  # プロジェクト選択ホーム
│   │   └── NotFound.tsx              # 404 ページ
│   ├── styles/
│   │   └── globals.css               # グローバルスタイル
│   └── main.tsx                      # React Router v6 ルーティング
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── ...
```

## URLマッピング

| パス | プロジェクト | 説明 |
|------|-------------|------|
| `/` | Home | プロジェクト選択画面 |
| `/component-library` | macOS Component Library | コンポーネント設計 |
| `/settings-window` | macOS Settings Window | 日本語対応設定画面 |
| `/auralog` | Auralog Design System | 最小限のデザイン哲学 |
| `/typozero` | TypoZero | macOS ネイティブスタイル |
| `/appbooks` | macOS Apple Books Style | Apple Books インスパイア |

## 利用方法

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザが `http://localhost:5173` で自動的に開き、ホーム画面が表示されます。

### 本番環境用ビルド

```bash
npm run build
```

`dist/` ディレクトリに出力されます。

### ビルドプレビュー

```bash
npm run preview
```

## メリット

✅ **単一サーバ管理**: `npm run dev` で全プロジェクトにアクセス可能  
✅ **完全な独立性**: 各プロジェクトが独立した `App.tsx`、スタイル、コンポーネント  
✅ **効率的なビルド**: 1つのビルドプロセスで全プロジェクトを生成  
✅ **簡単なデプロイ**: `dist/` を全体で 1 つだけデプロイ  
✅ **URLベースの切り替え**: Path による直感的なナビゲーション

## 技術スタック

- **React 18.3.1** - UIライブラリ
- **React Router v6** - クライアント側ルーティング
- **TypeScript** - 型安全性
- **Vite 6.3.5** - 高速ビルドツール
- **Tailwind CSS 3.3.6** - ユーティリティベースのスタイリング
- **Radix UI 30+** - アクセシビリティ考慮済みコンポーネント
- **Lucide React** - アイコンライブラリ

## 注意事項

### 各プロジェクトは完全に独立

- UI コンポーネント（`src/pages/*/components/`）
- スタイル（`src/pages/*/styles/`）
- ガイドライン（`src/pages/*/guidelines/`）

各プロジェクト間でコンポーネント共有はできません。これは意図的な設計です。

### Path ベースのルーティング

- `src/main.tsx` で React Router v6 を使用してルーティング
- 各 URL パスで対応する `App.tsx` がレンダリングされます

## トラブルシューティング

### "Cannot find module" エラー

各 `pages/*/components/` 配下のパスをインポート時に確認してください：

```tsx
// ✅ 正しい例（auralog から別のファイルをインポート）
import { SomeComponent } from '../components/SomeComponent';

// ❌ 誤った例（別プロジェクトのコンポーネントをインポート）
import { ComponentLibraryComponent } from '../../component-library/components/...';
```

### ポート 5173 が既に使用中

```bash
# 別のポートで起動
npm run dev -- --port 5174
```

### Tailwind CSS が適用されない

`tailwind.config.js` の `content` 設定を確認してください。既に以下で設定済みです：

```js
content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}',
],
```

## 今後の拡張

新しいプロジェクトを追加する場合：

1. `src/pages/new-project/` ディレクトリを作成
2. `App.tsx` を実装
3. `src/main.tsx` に Route を追加
4. `src/pages/Home.tsx` にプロジェクト情報を追加

## 参考ドキュメント

- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
