import Foundation
import AVFoundation
import Flutter

class RecorderService: NSObject, AVAudioRecorderDelegate {
    private var audioRecorder: AVAudioRecorder?
    private var isRecording = false
    private var messenger: FlutterBinaryMessenger
    private var startTime: Date?
    private var timer: Timer?
    private var eventSink: FlutterEventSink?
    private var eventChannel: FlutterEventChannel?

    init(messenger: FlutterBinaryMessenger) {
        self.messenger = messenger
        super.init()

        let controller = (UIApplication.shared.delegate as! FlutterAppDelegate).window?.rootViewController as! FlutterViewController
        self.eventChannel = FlutterEventChannel(name: "com.example.vozoo/recorder_events", binaryMessenger: messenger)
        self.eventChannel?.setStreamHandler(self)
    }

    func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "start":
            startRecording(result: result)
        case "stop":
            stopRecording(result: result)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func startRecording(result: @escaping FlutterResult) {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default)
            try audioSession.setActive(true)

            let docDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let audioFilename = docDir.appendingPathComponent("recording.wav")

            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM),
                AVSampleRateKey: 48000.0,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsBigEndianKey: false,
                AVLinearPCMIsFloatKey: false,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]

            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self

            if audioRecorder?.record() == true {
                isRecording = true
                startTime = Date()
                startTimer()
                result(nil)
            } else {
                result(FlutterError(code: "REC_ERROR", message: "Failed to start recording (record() returned false)", details: nil))
            }
        } catch {
            result(FlutterError(code: "REC_ERROR", message: "Failed to start recording", details: error.localizedDescription))
        }
    }

    private func stopRecording(result: @escaping FlutterResult) {
        guard isRecording else {
            result(FlutterError(code: "REC_ERROR", message: "No active recording", details: nil))
            return
        }

        audioRecorder?.stop()
        let finalDuration = Date().timeIntervalSince(startTime ?? Date())
        stopTimer()
        isRecording = false

        if let url = audioRecorder?.url {
            let response: [String: Any] = [
                "path": url.path,
                "duration": Int(finalDuration * 1000)
            ]
            result(response)
        } else {
            result(FlutterError(code: "REC_ERROR", message: "No recording URL found", details: nil))
        }
        audioRecorder = nil
    }

    private func startTimer() {
        // Run timer on main thread
        DispatchQueue.main.async {
            self.timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                guard let self = self, let sink = self.eventSink, let start = self.startTime else { return }
                let duration = Date().timeIntervalSince(start)
                sink(Int(duration * 1000))
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}

extension RecorderService: FlutterStreamHandler {
    func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        self.eventSink = events
        return nil
    }

    func onCancel(withArguments arguments: Any?) -> FlutterError? {
        self.eventSink = nil
        return nil
    }
}
