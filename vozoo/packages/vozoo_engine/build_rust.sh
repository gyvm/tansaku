#!/bin/bash
set -euo pipefail

# Build Rust DSP engine for the specified platform
# Usage: ./build_rust.sh [android|ios|host]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CARGO_DIR="$SCRIPT_DIR"

build_android() {
    echo "Building for Android..."
    if ! command -v cargo-ndk &> /dev/null; then
        echo "Installing cargo-ndk..."
        cargo install cargo-ndk
    fi

    local JNILIB_DIR="$SCRIPT_DIR/android/src/main/jniLibs"
    cargo ndk -t aarch64-linux-android -t armv7-linux-androideabi -t x86_64-linux-android \
        -o "$JNILIB_DIR" \
        build -p vozoo-ffi --release
    echo "Android build complete: $JNILIB_DIR"
}

build_ios() {
    echo "Building for iOS..."
    local TARGETS=("aarch64-apple-ios")

    # Add simulator target if building for development
    if [[ "${BUILD_SIM:-0}" == "1" ]]; then
        TARGETS+=("aarch64-apple-ios-sim")
    fi

    for target in "${TARGETS[@]}"; do
        rustup target add "$target" 2>/dev/null || true
        cargo build -p vozoo-ffi --release --target "$target"
    done
    echo "iOS build complete"
}

build_host() {
    echo "Building for host (testing)..."
    cargo build -p vozoo-ffi --release
    echo "Host build complete"
}

case "${1:-host}" in
    android) build_android ;;
    ios)     build_ios ;;
    host)    build_host ;;
    all)
        build_host
        build_android
        build_ios
        ;;
    *)
        echo "Usage: $0 [android|ios|host|all]"
        exit 1
        ;;
esac
