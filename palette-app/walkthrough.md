# Walkthrough (実施内容)

## 概要
Tauri + React + TypeScript を使用した「パレット（付箋/画像を置ける窓）」の超シンプルMockアプリを作成しました。
`palette-app` ディレクトリに独立したプロジェクトとして構築されています。

## 変更されたファイル
- `palette-app/`
  - `src/`
    - `components/`: UIコンポーネント (`Board`, `Sticky`, `ImageItem`)
    - `hooks/`: ロジック (`useBoard`, `useDraggable`)
    - `types.ts`: データ型定義
    - `App.tsx`: メイン画面構成
  - `src-tauri/`: Tauri設定ファイル (`tauri.conf.json` でウィンドウサイズ900x600に設定)
  - `package.json`: 依存関係定義
  - `README.md`: 実行手順

## 実装機能
1. **付箋 (Sticky) 追加**: テキスト編集可能な付箋をキャンバスに追加。
2. **画像 (Image) 追加**: ローカル画像をアップロードして表示。
3. **ドラッグ移動**: 付箋と画像をマウスドラッグで自由に配置変更。
4. **ローカル永続化**: `localStorage` を使用して、リロード後も配置と内容を復元。
5. **Markdown エクスポート**: 現在のボード内容を Markdown 形式で出力・コピー可能。

## 検証結果
- Playwright による自動テストを実施し、以下を確認しました。
  - アプリの起動とタイトル確認 ("Palette")
  - 付箋の追加とテキスト入力
  - エクスポートモーダルの表示と内容確認
- スクリーンショット (`screenshot.png`) にて、UIが正しく描画されていることを確認しました。

## 今後の拡張性
- データモデル (`BoardItem`) は拡張可能な形にしており、将来的に色変更やリサイズ機能を追加しやすい構造です。
- `src-tauri` がセットアップされているため、`npm run tauri dev` で即座にデスクトップアプリとして開発を進められます。
