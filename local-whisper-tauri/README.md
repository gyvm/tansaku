# Local Whisper Tauri

ローカルで文字起こしと話者分離を実行するデスクトップアプリです。音声ファイルを選択して、ワンクリックで文字起こし＋話者分離（任意）を行えます。

## 主な機能

- 音声/動画ファイルの文字起こし
- 話者分離（pyannote.audio）
- 話者ラベル付きのセグメント表示
- Markdown 形式での書き出し

## セットアップ

### 1. フロントエンド依存

```bash
cd local-whisper-tauri
npm install
```

### 2. 話者分離（pyannote.audio）用 venv

衝突回避のため、専用 venv を作成します。

```bash
cd local-whisper-tauri
python3 -m venv .venv-diarize
source .venv-diarize/bin/activate
pip install -r sidecar/requirements.txt
```

### 3. 環境変数

リポジトリ直下の `.env` に Hugging Face トークンを入れてください。

```
PYANNOTE_AUTH_TOKEN=YOUR_HF_TOKEN
```

## 起動

```bash
cd local-whisper-tauri
export LOCAL_WHISPER_PYTHON="/Users/yosuke/GitHub/tansaku/local-whisper-tauri/.venv-diarize/bin/python"
npm run tauri dev
```

## 使い方（UI）

1. 音声ファイルをドラッグ&ドロップ、または Open で選択
2. 「Enable diarization」をONにする場合は話者数（Auto/2/3）を選択
3. 「Start analysis」を押す
4. Transcript に話者タグが付いたセグメントが表示される
5. 「Download Markdown」で Markdown を保存

## コマンドでの話者分離テスト

UI を使わずに sidecar を直接実行できます。

```bash
cd /Users/yosuke/GitHub/tansaku/local-whisper-tauri
set -a; source /Users/yosuke/GitHub/tansaku/.env; set +a
ffmpeg -y -i "/Users/yosuke/Downloads/download.mp3" -ac 1 -ar 16000 -f wav "/Users/yosuke/Downloads/diarize-input.wav"
/Users/yosuke/GitHub/tansaku/local-whisper-tauri/.venv-diarize/bin/python \
  /Users/yosuke/GitHub/tansaku/local-whisper-tauri/sidecar/diarize.py \
  --audio "/Users/yosuke/Downloads/diarize-input.wav" \
  --out "/Users/yosuke/Downloads/diarize-output.json" \
  --num-speakers 2
```

出力 JSON は `[{speaker, start, end}, ...]` の形式です。
