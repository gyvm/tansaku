# iOS Whisper.cpp Demo App

このプロジェクトは、iPhone上で `whisper.cpp` を動作させ、オフライン環境下での音声認識を行うデモアプリです。

## 前提条件

* **Xcode 15.0 以上**
* **iOS 17.0 以上** (iOS 16でも動作可能ですが、検証はiOS 17で行っています)
* **CocoaPods は不要** (Swift Package Managerを使用)

## セットアップ手順

このリポジトリには `.xcodeproj` ファイルが含まれていません。以下の手順に従って、Xcodeプロジェクトを作成し、ソースコードを統合してください。

### 1. モデルの準備

まず、Whisperのモデルファイルをダウンロードします。ターミナルで以下のコマンドを実行してください。

```bash
cd ios-whisper-demo
chmod +x scripts/download_models.sh
./scripts/download_models.sh
```

成功すると `ios-whisper-demo/Resources/` ディレクトリに `ggml-tiny.bin` と `ggml-base.bin` がダウンロードされます。

### 2. Xcodeプロジェクトの作成

1. Xcodeを起動し、**"Create a new Xcode project"** を選択します。
2. **"iOS"** タブの **"App"** を選択し、Nextをクリックします。
3. 以下の設定を入力します:
   * **Product Name:** `iOSWhisperDemo`
   * **Organization Identifier:** `com.example` (任意)
   * **Interface:** SwiftUI
   * **Language:** Swift
   * **Storage:** None
4. プロジェクトの保存先として、このリポジトリのルート (`ios-whisper-demo` フォルダの親ディレクトリ、または任意の場所) を選択しますが、**ソースコードの管理がしやすいよう、新規作成したプロジェクトフォルダの中身を、このリポジトリの `ios-whisper-demo` ディレクトリに統合するか、または `ios-whisper-demo` ディレクトリをそのままプロジェクトフォルダとして使うように調整するとスムーズです。**

   *推奨手順:*
   デスクトップ等に一旦プロジェクトを作成し、生成された `.xcodeproj` ファイルを開きます。

### 3. パッケージの追加 (whisper.spm)

1. Xcodeのメニューバーから **File > Add Package Dependencies...** を選択します。
2. 検索バーに以下のURLを入力します:
   `https://github.com/ggerganov/whisper.spm`
3. **Add Package** をクリックします。
4. Targetへの追加画面で、`whisper` ライブラリを `iOSWhisperDemo` ターゲットに追加します。

### 4. ソースコードの追加

このリポジトリにあるソースコードをプロジェクトに追加します。

1. Xcodeのプロジェクトナビゲータで、`iOSWhisperDemo` フォルダ（青いアイコンのプロジェクトファイルではなく、黄色のフォルダ）を右クリックし、**"Add Files to 'iOSWhisperDemo'..."** を選択します。
2. `ios-whisper-demo/Sources/` フォルダ内の以下のファイルを選択して追加します:
   * `AudioRecorder.swift`
   * `WhisperState.swift`
   * `ContentView.swift`
   * `iOSWhisperDemoApp.swift` (または、既存の `App.swift` をこれに置き換えるか、内容をコピーしてください)
   * **重要:** "Copy items if needed" にチェックを入れ、"Create groups" を選択してください。

3. デフォルトで生成された `ContentView.swift` や `iOSWhisperDemoApp.swift` (または `App.swift`) が既にある場合は、置き換えるか削除してください。

### 5. リソース（モデル）の追加

1. 再度 **"Add Files to 'iOSWhisperDemo'..."** を選択します。
2. `ios-whisper-demo/Resources/` フォルダ内の `ggml-tiny.bin` (または `ggml-base.bin`) を選択して追加します。
3. **重要:** "Copy items if needed" にチェックを入れ、**Target Membership** で `iOSWhisperDemo` にチェックが入っていることを確認してください。

### 6. Info.plist の設定（マイク権限）

アプリがクラッシュしないように、マイクの使用許可説明を追加します。

1. プロジェクトナビゲータで プロジェクト名（青いアイコン）を選択し、**Target** の **Info** タブを開きます。
2. **Custom iOS Target Properties** にキーを追加します。
   * **Key:** `Privacy - Microphone Usage Description`
   * **Value:** `音声認識のためにマイクを使用します。`

### 7. ビルドと実行

1. iPhone実機をMacに接続します（シミュレータではマイク入力が動作しない場合があります）。
2. ビルドターゲットを実機に設定します。
3. **Run (Cmd + R)** を実行します。
4. アプリが起動したら、マイクボタンをタップして録音を開始し、もう一度タップして停止します。数秒〜数十秒後に認識結果が表示されます。

## 注意事項

* **パフォーマンス:** `ggml-base.bin` は `tiny` より精度が高いですが、推論に時間がかかります。まずは `tiny` で動作確認することをお勧めします。コード内の `WhisperState.swift` の `loadModel()` で読み込むモデル名を変更できます。
* **メモリ:** モデルファイルはメモリにロードされます。古いデバイスではメモリ不足になる可能性があります。
* **C++ Interop:** `whisper.spm` は C++ ライブラリのラッパーです。ビルド時に C++ 関連の警告が出ることがありますが、通常は無視して問題ありません。
