# AI 実行ガイド

このドキュメントは、AI が自動検証・調査を行うための手順をまとめたものです。

## 前提

- 作業ディレクトリ: `/Users/yosuke/GitHub/tansaku/local-whisper-tauri`
- 話者分離は専用 venv（`.venv-diarize`）を利用
- `.env` に `PYANNOTE_AUTH_TOKEN` を設定済み

## 環境準備

### 1. 専用 venv 作成と依存インストール

```bash
cd /Users/yosuke/GitHub/tansaku/local-whisper-tauri
python3 -m venv .venv-diarize
source .venv-diarize/bin/activate
pip install -r sidecar/requirements.txt
```

### 2. トークン設定

`.env` に以下を設定:

```
PYANNOTE_AUTH_TOKEN=YOUR_HF_TOKEN
```

## CLI での動作確認

音声ファイルを使って、UI なしで話者分離を検証できます。

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

成功時は `Diarization complete` が表示され、JSON が生成されます。

## UI での動作確認

```bash
cd /Users/yosuke/GitHub/tansaku/local-whisper-tauri
export LOCAL_WHISPER_PYTHON="/Users/yosuke/GitHub/tansaku/local-whisper-tauri/.venv-diarize/bin/python"
npm run tauri dev
```

## 失敗時の確認ポイント

- `PYANNOTE_AUTH_TOKEN` が設定されているか
- `.venv-diarize` の Python が使用されているか (`LOCAL_WHISPER_PYTHON`)
- `sidecar/requirements.txt` の依存がインストールされているか
