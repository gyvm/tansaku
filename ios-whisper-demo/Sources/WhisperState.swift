import Foundation
import whisper

@MainActor
class WhisperState: ObservableObject {
    @Published var isModelLoaded = false
    @Published var isTranscribing = false
    @Published var messageLog = ""
    @Published var currentText = ""

    // We keep context as a raw pointer.
    private var context: OpaquePointer?

    deinit {
        if let context = context {
            whisper_free(context)
        }
    }

    func loadModel() {
        let modelNames = ["ggml-tiny", "ggml-base"]
        var modelPath: String?

        for name in modelNames {
            if let path = Bundle.main.path(forResource: name, ofType: "bin") {
                modelPath = path
                break
            }
        }

        guard let path = modelPath else {
            messageLog += "Model file not found. Please add ggml-tiny.bin or ggml-base.bin to the bundle.\n"
            return
        }

        messageLog += "Loading model from \(path)...\n"

        // whisper_init_from_file expects UnsafePointer<CChar>
        // Swift bridges String to const char* automatically
        context = whisper_init_from_file(path)

        if context != nil {
            isModelLoaded = true
            messageLog += "Model loaded successfully.\n"
        } else {
            messageLog += "Failed to load model.\n"
        }
    }

    func transcribe(audioFrames: [Float]) async {
        guard let context = context else {
            messageLog += "Model not loaded.\n"
            return
        }

        guard !audioFrames.isEmpty else {
            messageLog += "No audio frames to transcribe.\n"
            return
        }

        isTranscribing = true
        messageLog += "Transcribing \(audioFrames.count) frames...\n"

        // Capture context locally to pass to detached task
        let ctx = context

        await Task.detached {
            // prepare params
            // WHISPER_SAMPLING_GREEDY might be an enum case or global constant.
            // If it's not found, we might need `whisper_sampling_strategy.GREEDY`
            // Assuming standard C import:
            var params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY)
            params.print_realtime = false
            params.print_progress = false
            params.n_threads = 4

            // Set language to Japanese
            let lang = "ja"

            // Perform transcription
            let ret = lang.withCString { langPtr -> Int32 in
                var paramsCopy = params
                paramsCopy.language = langPtr

                // whisper_full expects UnsafePointer<Float>
                return audioFrames.withUnsafeBufferPointer { bufferPtr in
                    guard let baseAddress = bufferPtr.baseAddress else { return -1 }
                    return whisper_full(ctx, paramsCopy, baseAddress, Int32(audioFrames.count))
                }
            }

            if ret != 0 {
                await MainActor.run {
                    self.messageLog += "Whisper failed with code \(ret)\n"
                    self.isTranscribing = false
                }
                return
            }

            // Extract text
            let n_segments = whisper_full_n_segments(ctx)
            var result = ""
            for i in 0..<Int(n_segments) {
                if let textPtr = whisper_full_get_segment_text(ctx, Int32(i)) {
                    let text = String(cString: textPtr)
                    result += text
                }
            }

            await MainActor.run {
                self.currentText = result
                self.messageLog += "Transcription complete.\n"
                self.isTranscribing = false
            }
        }.value
    }
}
