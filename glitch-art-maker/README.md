# Glitch Art Maker

ブラウザ上で動作するグリッチアート生成アプリケーションです。
画像をアップロードし、スライダーで直感的に「データ崩壊」のようなエフェクトを加えることで、サイバーパンク風のアート作品を作成できます。

![Glitch Art Maker](https://placehold.co/600x400/000000/00d2ff?text=Glitch+Art+Maker)

## 機能概要

*   **画像アップロード**: ドラッグ＆ドロップまたはファイル選択で画像を読み込みます（最大1200pxに自動リサイズ）。
*   **リアルタイムプレビュー**: Canvas APIを使用した高速なプレビュー。
*   **5種類のグリッチエフェクト**:
    1.  **Scanline**: 走査線効果でレトロなディスプレイ感を演出。
    2.  **RGB Split**: 色収差（色ズレ）を作り出すエフェクト。
    3.  **Slice Shift**: 画像を水平方向にランダムに切り取り、左右にずらす「バグ」表現。
    4.  **Digital Noise**: デジタルノイズ（粒状感）を追加。
    5.  **Pixel Sort**: 明度に基づいたピクセルの並び替え風エフェクト。
*   **プリセット**: "Cyberpunk Mild", "Broken Signal", "Neon Nightmare" の3種類から一発設定可能。
*   **PNGダウンロード**: 加工した画像を保存できます。

## 技術スタック

*   **Frontend**: React, TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Graphics**: HTML5 Canvas API (No WebGL, No external image processing libraries)

## セットアップ手順

Node.js (v16以上推奨) が必要です。

1.  プロジェクトディレクトリに移動します。
    ```bash
    cd glitch-art-maker
    ```

2.  依存パッケージをインストールします。
    ```bash
    npm install
    ```

3.  開発サーバーを起動します。
    ```bash
    npm run dev
    ```

4.  ブラウザで `http://localhost:5173` (または表示されるURL) にアクセスします。

## 拡張アイデア (Future Work)

現在実装されていませんが、以下のような機能拡張が考えられます。

*   **WebGL版**: シェーダーを利用したさらに高度で高速なエフェクト。
*   **GIF/動画出力**: グリッチの動きをそのままアニメーションとして保存。
*   **Undo/Redo**: 操作履歴の管理。
*   **レイヤー機能**: 複数のエフェクトを重ね掛けしたり、部分的に適用したりする機能。
*   **シード値固定**: ランダムエフェクトの再現性を担保するための乱数シード指定。

## ライセンス

MIT License
