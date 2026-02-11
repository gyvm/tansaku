import Foundation
import AVFoundation
import ScreenCaptureKit
import CoreGraphics
import AppKit

// Global instance to keep the recorder alive
var recorder: AudioRecorder?

@_cdecl("start_recording")
public func start_recording(path: UnsafePointer<CChar>, includeMic: Bool, includeSys: Bool) -> Bool {
    guard let pathStr = String(cString: path, encoding: .utf8) else { return false }

    if #available(macOS 12.3, *) {
        recorder = AudioRecorder()
        return recorder?.start(path: pathStr, includeMic: includeMic, includeSys: includeSys) ?? false
    } else {
        print("macOS 12.3+ required for ScreenCaptureKit")
        return false
    }
}

@_cdecl("stop_recording")
public func stop_recording() -> Bool {
    if #available(macOS 12.3, *) {
        let res = recorder?.stop() ?? false
        recorder = nil
        return res
    }
    return false
}

@_cdecl("check_permissions")
public func check_permissions() -> Int32 {
    // Return bitmask: 1 = mic, 2 = screen
    var status: Int32 = 0

    // Mic check
    switch AVCaptureDevice.authorizationStatus(for: .audio) {
    case .authorized:
        status |= 1
    default:
        break
    }

    // Screen check
    // CGPreflightScreenCaptureAccess available macOS 11.0+
    if CGPreflightScreenCaptureAccess() {
        status |= 2
    }

    return status
}

@_cdecl("request_permissions")
public func request_permissions() {
    AVCaptureDevice.requestAccess(for: .audio) { _ in }
    // CGRequestScreenCaptureAccess available macOS 11.0+
    CGRequestScreenCaptureAccess()
}

@_cdecl("open_permissions_settings")
public func open_permissions_settings() {
    if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture") {
        NSWorkspace.shared.open(url)
    }
}

@available(macOS 12.3, *)
class AudioRecorder: NSObject, SCStreamOutput {
    private var engine: AVAudioEngine!
    private var file: AVAudioFile!
    private var stream: SCStream?
    private var sysAudioSource: AVAudioSourceNode?

    // Circular Buffer implementation
    // Capacity for approx 2 sec of audio at 48kHz stereo
    private let bufferCapacity = 48000 * 2 * 2
    private var buffer: [Float]
    private var head = 0
    private var tail = 0
    private var count = 0
    private let bufferLock = NSLock()

    override init() {
        buffer = [Float](repeating: 0, count: bufferCapacity)
        super.init()
    }

    deinit {
        // Ensure resources are released if instance is deallocated
        // Note: stop() calls async stream stop, which might race if main thread exits immediately
        _ = stop()
    }

    func start(path: String, includeMic: Bool, includeSys: Bool) -> Bool {
        engine = AVAudioEngine()
        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

        // Setup File
        let url = URL(fileURLWithPath: path)
        let directory = url.deletingLastPathComponent()
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatLinearPCM,
                AVSampleRateKey: 48000.0,
                AVNumberOfChannelsKey: 2,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsFloatKey: false,
                AVLinearPCMIsBigEndianKey: false,
                AVLinearPCMIsNonInterleavedKey: false
            ]
            file = try AVAudioFile(forWriting: url, settings: settings, commonFormat: .pcmFormatInt16, interleaved: true)
        } catch {
            print("Failed to create file: \(error)")
            return false
        }

        // Setup Mic
        if includeMic {
            let input = engine.inputNode
            let inputFormat = input.inputFormat(forBus: 0)
            if inputFormat.channelCount > 0 {
                engine.connect(input, to: engine.mainMixerNode, format: inputFormat)
            }
        }

        // Setup System Audio
        if includeSys {
             sysAudioSource = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, audioBufferList in
                 guard let self = self else { return noErr }

                 let abl = UnsafeMutableAudioBufferListPointer(audioBufferList)
                 let ptrL = abl[0].mData?.assumingMemoryBound(to: Float.self)
                 let ptrR = abl[1].mData?.assumingMemoryBound(to: Float.self)

                 self.bufferLock.lock()
                 if self.count >= Int(frameCount) * 2 {
                     for i in 0..<Int(frameCount) {
                         ptrL?[i] = self.pop()
                         ptrR?[i] = self.pop()
                     }
                 } else {
                      for i in 0..<Int(frameCount) {
                         ptrL?[i] = 0
                         ptrR?[i] = 0
                      }
                 }
                 self.bufferLock.unlock()

                 return noErr
             }

             if let src = sysAudioSource {
                 engine.attach(src)
                 engine.connect(src, to: engine.mainMixerNode, format: format)
                 startScreenCapture()
             }
        }

        engine.mainMixerNode.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, time in
            guard let self = self else { return }
            do {
                try self.file.write(from: buffer)
            } catch {
                print("Write error: \(error)")
            }
        }

        do {
            try engine.start()
            return true
        } catch {
            print("Engine start error: \(error)")
            return false
        }
    }

    func stop() -> Bool {
        if engine.isRunning {
            engine.stop()
            engine.mainMixerNode.removeTap(onBus: 0)
        }
        if let stream = stream {
            stream.stopCapture { _ in }
            self.stream = nil
        }
        return true
    }

    private func push(_ value: Float) {
        if count < bufferCapacity {
            buffer[tail] = value
            tail = (tail + 1) % bufferCapacity
            count += 1
        } else {
            // Overwrite oldest
            buffer[tail] = value
            tail = (tail + 1) % bufferCapacity
            head = (head + 1) % bufferCapacity
        }
    }

    private func pop() -> Float {
        if count > 0 {
            let value = buffer[head]
            head = (head + 1) % bufferCapacity
            count -= 1
            return value
        }
        return 0
    }

    func startScreenCapture() {
        SCShareableContent.getShareableContent { content, error in
            guard let content = content else { return }
            guard let display = content.displays.first else { return }

            let filter = SCContentFilter(display: display, excludingApplications: [], excludingWindows: [])
            let config = SCStreamConfiguration()
            config.capturesAudio = true
            config.capturesVideo = false
            config.sampleRate = 48000
            config.channelCount = 2
            config.showsCursor = false
            config.queueDepth = 5 // Keep latency low

            do {
                self.stream = SCStream(filter: filter, configuration: config, delegate: nil)
                try self.stream?.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "com.ainimvp.audio.queue"))
                self.stream?.startCapture { error in
                    if let error = error { print("SCStream error: \(error)") }
                }
            } catch {
                print("Stream creation error: \(error)")
            }
        }
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }

        // Allocate space for up to 2 buffers safely
        let listSize = MemoryLayout<AudioBufferList>.size + MemoryLayout<AudioBuffer>.size
        let bufferListPointer = UnsafeMutableRawPointer.allocate(byteCount: listSize, alignment: MemoryLayout<AudioBufferList>.alignment)
        defer { bufferListPointer.deallocate() }

        let audioBufferList = bufferListPointer.bindMemory(to: AudioBufferList.self, capacity: 1)

        var blockBuffer: CMBlockBuffer?

        CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
            sampleBuffer,
            bufferListSizeNeededOut: nil,
            bufferListOut: audioBufferList,
            bufferListSize: listSize,
            blockBufferAllocator: nil,
            blockBufferMemoryAllocator: nil,
            flags: 0,
            blockBufferOut: &blockBuffer
        )

        let buffers = UnsafeMutableAudioBufferListPointer(audioBufferList)

        bufferLock.lock()
        defer { bufferLock.unlock() }

        if buffers.count == 2 {
            let mDataL = buffers[0].mData?.assumingMemoryBound(to: Float.self)
            let mDataR = buffers[1].mData?.assumingMemoryBound(to: Float.self)
            let frameCount = Int(buffers[0].mDataByteSize) / MemoryLayout<Float>.size

            for i in 0..<frameCount {
                push(mDataL?[i] ?? 0)
                push(mDataR?[i] ?? 0)
            }
        } else if buffers.count == 1 {
            let mData = buffers[0].mData?.assumingMemoryBound(to: Float.self)
            let totalSamples = Int(buffers[0].mDataByteSize) / MemoryLayout<Float>.size

            // Assume interleaved if 1 buffer? Or Mono?
            // If mNumberChannels is 2, it's interleaved stereo.
            // If mNumberChannels is 1, it's mono.

            let channels = buffers[0].mNumberChannels
            if channels == 2 {
                // Corrected loop: iterate over FRAMES, not samples
                let frameCount = totalSamples / 2
                for i in 0..<frameCount {
                    // L, R, L, R...
                    push(mData?[i*2] ?? 0)
                    push(mData?[i*2+1] ?? 0)
                }
            } else {
                // Mono -> Stereo
                for i in 0..<totalSamples {
                    let val = mData?[i] ?? 0
                    push(val)
                    push(val)
                }
            }
        }
    }
}
