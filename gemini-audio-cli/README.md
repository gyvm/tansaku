# Gemini Audio CLI

音声ファイルを指定して、Google Gemini API を使って「要約」と「続きの予想」を行うCLIツールです。
長い音声ファイルでも、自動的に冒頭90秒を切り出して処理します。

## 必要条件

*   Node.js (v18以上推奨)
*   **FFmpeg** (音声のトリミング処理に必須です)

### FFmpeg のインストール方法

このツールを使用するには、システムに `ffmpeg` がインストールされており、パスが通っている必要があります。

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```
または、公式サイトからバイナリをダウンロードして環境変数 Path に追加してください。

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

## セットアップ

1.  ディレクトリに移動し、依存関係をインストールします。
    ```bash
    npm install
    ```

2.  Google Gemini API キーを取得します。
    *   [Google AI Studio](https://aistudio.google.com/) でキーを作成してください。

3.  環境変数を設定します。
    プロジェクトルートに `.env` ファイルを作成し、以下の内容を記述してください。

    ```env
    GEMINI_AUDIO_CLI_API_KEY=あなたのAPIキー
    ```

## 使い方

開発環境(`ts-node`)で実行する場合:

```bash
# 基本的な使い方 (npm start は ts-node index.ts を実行します)
npm start -- <音声ファイルのパス>

# 例
npm start -- ./interview.mp3
```

### オプション

*   `-s, --stats`: APIの使用トークン数と概算コストを表示します。
*   `-m, --model <model>`: 使用するGeminiのモデルを指定します（デフォルト: `gemini-1.5-flash`）。

**コスト表示の例:**
```bash
npm start -- ./meeting.m4a --stats
```

**モデルを変更する例:**
```bash
npm start -- ./meeting.m4a --model gemini-1.5-pro
```

## 注意事項

*   コスト表示はあくまで目安です。実際の請求額とは異なる場合があります。
*   音声ファイルは処理のためにGoogleのサーバーにアップロードされます（処理終了後に削除リクエストを送ります）。
