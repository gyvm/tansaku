# Engineering Manual: Audio Recording System

このドキュメントは、本アプリケーションの音声処理エンジンの詳細な実装仕様を記述したものです。

## システム構成図

```text
[Mic (inputNode)] --------> [mainMixerNode]
                               |
[System Audio (SCStream)]      | (Mix)
      |                        |
[Circular Buffer]              |
      |                        |
[SourceNode (Pull)] ---------> |
                               |
                               v
                     [SilentMixer (Dead end)]
                               |
                               | (Tap on mainMixerNode)
                               v
                        [AVAudioFile (WAV)]
```

## 主要コンポーネント

### 1. Swift Bridge (`audio_recorder.swift`)
- **`@_cdecl`**: RustからC ABI経由で呼び出すためのエントリーポイント。
- **`AudioRecorder`クラス**: `AVAudioEngine`と`SCStreamOutput`を管理する中心的なクラス。

### 2. 音声パイプラインの工夫
- **ハウリング対策**: `engine.mainMixerNode` を `engine.outputNode` に接続せず、独立した `AVAudioMixerNode` (volume=0) に接続しています。これにより、録音データがスピーカーから再生され、それをSCStreamが再度拾う無限ループを回避しています。
- **サンプリングレートの自動追従**: `engine.inputNode.inputFormat(forBus: 0).sampleRate` を取得し、それに基づいてファイルとミキサーのフォーマットを決定します。

### 3. ScreenCaptureKit (SCStream)
- システムオーディオのキャプチャに使用。
- `excludesCurrentProcessAudio = false` に設定し、システム全体の音を取得。
- `CMSampleBuffer` からデータを抽出し、スレッドセーフな `bufferLock` を介してサーキュラーバッファに `push` します。

## メンテナンス時の注意点

### 権限のハンドリング
- `CGPreflightScreenCaptureAccess()` と `CGRequestScreenCaptureAccess()` を使用して画面録画権限を管理します。
- 権限がない場合、`SCStream` は沈黙（データが届かない）します。

### ログデバッグ
- `logLine` 関数により `~/Library/Logs/AIniMVP Recorder.log` に詳細が出力されます。
- `DIRECT mic peak`: マイク単体の入力レベル。
- `Tap peak`: 最終的なミックス後のレベル。

### タップの制限
- 1つのバスに対して `installTap` は1つしか設定できません。デバッグ用と録音用で重複して設置しないよう注意してください。
