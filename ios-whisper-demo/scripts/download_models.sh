#!/bin/bash

# Define download directory
DOWNLOAD_DIR="$(dirname "$0")/../Resources"
mkdir -p "$DOWNLOAD_DIR"

# Base URL for whisper.cpp models
BASE_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main"

# Models to download
MODELS=("ggml-tiny.bin" "ggml-base.bin")

echo "Downloading Whisper models to $DOWNLOAD_DIR..."

for model in "${MODELS[@]}"; do
    if [ -f "$DOWNLOAD_DIR/$model" ]; then
        echo "✅ $model already exists."
    else
        echo "⬇️ Downloading $model..."
        if command -v curl >/dev/null 2>&1; then
            curl -L "$BASE_URL/$model" -o "$DOWNLOAD_DIR/$model"
        elif command -v wget >/dev/null 2>&1; then
            wget "$BASE_URL/$model" -O "$DOWNLOAD_DIR/$model"
        else
            echo "❌ Error: Neither curl nor wget is installed."
            exit 1
        fi

        if [ $? -eq 0 ]; then
            echo "✅ Downloaded $model successfully."
        else
            echo "❌ Failed to download $model."
            exit 1
        fi
    fi
done

echo "🎉 All models are ready!"
