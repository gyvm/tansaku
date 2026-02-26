# text-counter-gemini

中央入力フォーム + 左サイド統計 + Gemini校正ボタンを備えた React アプリです。

## セットアップ

```bash
cd text-counter-gemini
mise install
cp .env.example .env
npm install
npm run dev
```

## 環境変数

- `VITE_GEMINI_API_KEY`: Gemini APIキー
- `VITE_GEMINI_MODEL`: 利用モデル（省略時は `gemini-2.0-flash`）

## 現在の校正結果表示

校正後の文章は下部カードに表示し、以下の操作を用意しています。

- 結果をコピー
- 入力欄へ反映

表示仕様は後から変更しやすい構成にしてあります。
