# Mouse Marathon (macOS)

マウスカーソルの移動距離を計測し、フルマラソン（42.195km）完走を目指す macOS アプリケーションです。

## 技術スタック

*   **Framework:** Tauri v2
*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Backend:** Rust
*   **Architecture:** Mouse Polling (Store Safe)

## 必要要件

*   macOS (開発・ビルドに必須)
*   Node.js (v18+)
*   Rust (latest stable)
*   Xcode Command Line Tools

## セットアップ

1.  依存関係のインストール:
    ```bash
    npm install
    ```

2.  開発モードでの起動:
    ```bash
    npm run tauri dev
    ```

3.  本番ビルド (dmg/pkg):
    ```bash
    npm run tauri build
    ```

## 構成

*   `src/`: フロントエンド (React)
    *   `App.tsx`: UIエントリーポイント
    *   `hooks/useMouseMarathon.ts`: ビジネスロジック・状態管理
*   `src-tauri/`: バックエンド (Rust)
    *   `src/lib.rs`: マウス監視ロジック (Polling)

## 機能

*   **距離計測:** 0.1秒ごとのマウス位置ポーリングによる移動距離算出
*   **データ保存:** アプリ終了後も累計距離を保持 (Tauri Store)
*   **設定:** ピクセル/メートル換算値の調整
*   **祝福:** 42.195km ごとに祝福メッセージを表示

## App Store 申請について

本アプリは Mac App Store のサンドボックス要件に準拠するため、`CGEventTap` (入力監視) ではなく、定期的な座標取得 (Polling) を採用しています。
詳細は `STORE_GUIDE.md` を参照してください。
