import Foundation
import AVFoundation

@MainActor
class AudioRecorder: ObservableObject {
    @Published var isRecording = false
    @Published var errorMessage: String?

    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?

    // Raw samples at hardware rate
    private var rawSamples: [Float] = []
    private var rawSampleRate: Double = 44100.0
    private let lock = NSLock()

    // Final samples at 16kHz for Whisper
    var recordedData: [Float] = []

    func requestPermission() async -> Bool {
        let session = AVAudioSession.sharedInstance()
        switch session.recordPermission {
        case .granted:
            return true
        case .denied:
            errorMessage = "Microphone permission denied. Please enable it in Settings."
            return false
        case .undetermined:
            return await withCheckedContinuation { continuation in
                session.requestRecordPermission { granted in
                    if !granted {
                        Task { @MainActor in
                            self.errorMessage = "Microphone permission denied."
                        }
                    }
                    continuation.resume(returning: granted)
                }
            }
        @unknown default:
            return false
        }
    }

    func startRecording() throws {
        // Setup Audio Session
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement, options: .duckOthers)
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        rawSamples.removeAll()
        recordedData.removeAll()
        errorMessage = nil

        let engine = AVAudioEngine()
        self.audioEngine = engine
        let input = engine.inputNode
        self.inputNode = input

        let format = input.inputFormat(forBus: 0)
        self.rawSampleRate = format.sampleRate

        // Tap the input node
        input.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, time in
            guard let self = self else { return }

            guard let channelData = buffer.floatChannelData else { return }
            let ptr = channelData[0]
            let count = Int(buffer.frameLength)

            self.lock.lock()
            // Append samples
            for i in 0..<count {
                self.rawSamples.append(ptr[i])
            }
            self.lock.unlock()
        }

        engine.prepare()
        try engine.start()
        isRecording = true
    }

    func stopRecording() async {
        audioEngine?.stop()
        inputNode?.removeTap(onBus: 0)
        audioEngine = nil
        inputNode = nil
        isRecording = false

        let session = AVAudioSession.sharedInstance()
        try? session.setActive(false)

        // Convert audio on background thread
        await convertAudio()
    }

    private func convertAudio() async {
        let samples = self.rawSamples
        let srcRate = self.rawSampleRate

        guard !samples.isEmpty else { return }

        print("AudioRecorder: processing \(samples.count) samples at \(srcRate)Hz")

        // If sample rate is already 16kHz, just copy
        if abs(srcRate - 16000) < 1 {
            self.recordedData = samples
            return
        }

        // Use Task.detached to run on background
        let converted: [Float] = await Task.detached {
            let sourceFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: srcRate, channels: 1, interleaved: false)!
            let targetFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16000, channels: 1, interleaved: false)!

            guard let converter = AVAudioConverter(from: sourceFormat, to: targetFormat) else {
                return []
            }

            guard let sourceBuffer = AVAudioPCMBuffer(pcmFormat: sourceFormat, frameCapacity: AVAudioFrameCount(samples.count)) else {
                return []
            }
            sourceBuffer.frameLength = AVAudioFrameCount(samples.count)
            if let channelData = sourceBuffer.floatChannelData {
                // Unsafe copy
                // samples is a let constant (copy of array) captured by closure
                // Accessing it is safe
                samples.withUnsafeBufferPointer { bufferPtr in
                    if let baseAddress = bufferPtr.baseAddress {
                        // channelData[0] is UnsafeMutablePointer<Float>
                        channelData[0].assign(from: baseAddress, count: samples.count)
                    }
                }
            }

            // Calculate output size
            let ratio = 16000.0 / srcRate
            let targetFrameCount = AVAudioFrameCount(Double(samples.count) * ratio) + 2048 // Add padding

            guard let targetBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: targetFrameCount) else {
                return []
            }

            var error: NSError?
            var handled = false
            let inputBlock: AVAudioConverterInputBlock = { inNumPackets, outStatus in
                if handled {
                    outStatus.pointee = .noDataNow
                    return nil
                }
                handled = true
                outStatus.pointee = .haveData
                return sourceBuffer
            }

            converter.convert(to: targetBuffer, error: &error, withInputFrom: inputBlock)

            if let error = error {
                print("AudioRecorder: Conversion error: \(error.localizedDescription)")
            }

            if let channelData = targetBuffer.floatChannelData {
                let count = Int(targetBuffer.frameLength)
                let ptr = channelData[0]
                // Create array from buffer
                return Array(UnsafeBufferPointer(start: ptr, count: count))
            }

            return []
        }.value

        self.recordedData = converted
        print("AudioRecorder: Conversion complete. New count: \(converted.count)")
    }
}
