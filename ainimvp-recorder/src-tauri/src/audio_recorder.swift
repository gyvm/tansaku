import Foundation
import AVFoundation
import ScreenCaptureKit
import CoreGraphics
import AppKit

// Global instance to keep the recorder alive
var recorder: AudioRecorder?

private let logFileURL: URL = {
    let dir = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs")
    return dir.appendingPathComponent("AIniMVP Recorder.log")
}()

private func logLine(_ message: String) {
    let formatter = ISO8601DateFormatter()
    let timestamp = formatter.string(from: Date())
    let line = "[\(timestamp)] \(message)\n"

    if let data = line.data(using: .utf8) {
        let dir = logFileURL.deletingLastPathComponent()
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        if !FileManager.default.fileExists(atPath: logFileURL.path) {
            FileManager.default.createFile(atPath: logFileURL.path, contents: nil, attributes: nil)
        }
        if let handle = try? FileHandle(forWritingTo: logFileURL) {
            do {
                try handle.seekToEnd()
                try handle.write(contentsOf: data)
            } catch {
                // Ignore logging errors
            }
            try? handle.close()
        }
    }
    print(message)
}

@_cdecl("start_recording")
public func start_recording(path: UnsafePointer<CChar>, includeMic: Bool, includeSys: Bool) -> Bool {
    guard let pathStr = String(cString: path, encoding: .utf8) else { return false }

    logLine("start_recording path=\(pathStr) mic=\(includeMic) sys=\(includeSys)")
    logLine("log file path=\(logFileURL.path)")

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
        logLine("stop_recording result=\(res)")
        return res
    }
    return false
}

@_cdecl("check_permissions")
public func check_permissions() -> Int32 {
    var status: Int32 = 0
    switch AVCaptureDevice.authorizationStatus(for: .audio) {
    case .authorized: status |= 1
    default: break
    }
    if CGPreflightScreenCaptureAccess() { status |= 2 }
    logLine("check_permissions mic=\(((status & 1) != 0)) screen=\(((status & 2) != 0))")
    return status
}

@_cdecl("request_permissions")
public func request_permissions() {
    logLine("request_permissions")
    AVCaptureDevice.requestAccess(for: .audio) { _ in }
    CGRequestScreenCaptureAccess()
}

@_cdecl("open_permissions_settings")
public func open_permissions_settings() {
    logLine("open_permissions_settings")
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
    private var tapBufferCount = 0
    private var tapPeak: Float = 0
    private var micBufferCount = 0
    private var micPeak: Float = 0

    // Circular Buffer for system audio
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
        _ = stop()
    }

    func start(path: String, includeMic: Bool, includeSys: Bool) -> Bool {
        engine = AVAudioEngine()
        
        // 1. Determine base format based on hardware
        let inputFormat = engine.inputNode.inputFormat(forBus: 0)
        let sampleRate = inputFormat.sampleRate > 0 ? inputFormat.sampleRate : 48000
        let mixerFormat = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 2)!
        
        logLine("Start recording: sr=\(sampleRate) mic=\(includeMic) sys=\(includeSys)")
        logLine("Mic raw format: \(inputFormat)")

        // 2. Setup File
        let url = URL(fileURLWithPath: path)
        let directory = url.deletingLastPathComponent()
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
            file = try AVAudioFile(forWriting: url, settings: mixerFormat.settings)
            logLine("AVAudioFile created")
        } catch {
            logLine("File creation error: \(error)")
            return false
        }

        // 3. Setup Mic
        if includeMic {
            let input = engine.inputNode
            engine.connect(input, to: engine.mainMixerNode, format: inputFormat)
            
            input.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, _ in
                guard let self = self else { return }
                if let floatData = buffer.floatChannelData {
                    let frames = Int(buffer.frameLength)
                    var peak: Float = 0
                    for i in 0..<frames {
                        let v = fabsf(floatData[0][i])
                        if v > peak { peak = v }
                    }
                    if peak > self.micPeak { self.micPeak = peak }
                }
                self.micBufferCount += 1
                if self.micBufferCount % 100 == 0 {
                    logLine("DIRECT mic peak=\(self.micPeak)")
                    self.micPeak = 0
                }
            }
        }

        // 4. Setup System Audio
        if includeSys {
             sysAudioSource = AVAudioSourceNode(format: mixerFormat) { [weak self] _, _, frameCount, audioBufferList in
                 guard let self = self else { return noErr }
                 let abl = UnsafeMutableAudioBufferListPointer(audioBufferList)
                 let ptrL = abl[0].mData?.assumingMemoryBound(to: Float.self)
                 let ptrR = abl[1].mData?.assumingMemoryBound(to: Float.self)
                 self.bufferLock.lock()
                 if self.count >= Int(frameCount) * 2 {
                     for i in 0..<Int(frameCount) {
                         ptrL?[i] = self.pop(); ptrR?[i] = self.pop()
                     }
                 } else {
                      for i in 0..<Int(frameCount) {
                         ptrL?[i] = 0; ptrR?[i] = 0
                      }
                 }
                 self.bufferLock.unlock()
                 return noErr
             }

             if let src = sysAudioSource {
                 engine.attach(src)
                 engine.connect(src, to: engine.mainMixerNode, format: mixerFormat)
                 logLine("SysAudioSource attached")
                 startScreenCapture()
             }
        }

        // 5. Prevent Howling: Disconnect from speaker output
        let silentMixer = AVAudioMixerNode()
        engine.attach(silentMixer)
        engine.connect(engine.mainMixerNode, to: silentMixer, format: mixerFormat)
        silentMixer.outputVolume = 0

        // 6. Record the mix
        engine.mainMixerNode.installTap(onBus: 0, bufferSize: 4096, format: mixerFormat) { [weak self] buffer, time in
            guard let self = self else { return }
            do {
                if let floatData = buffer.floatChannelData {
                    let frames = Int(buffer.frameLength)
                    let channels = Int(buffer.format.channelCount)
                    for ch in 0..<channels {
                        for i in 0..<frames {
                            let v = fabsf(floatData[ch][i])
                            if v > self.tapPeak { self.tapPeak = v }
                        }
                    }
                }
                self.tapBufferCount += 1
                if self.tapBufferCount % 100 == 0 {
                    logLine("Tap peak=\(self.tapPeak)")
                    self.tapPeak = 0
                }
                try self.file.write(from: buffer)
            } catch {
                logLine("File write error: \(error)")
            }
        }

        do {
            engine.prepare()
            try engine.start()
            logLine("Engine started")
            return true
        } catch {
            logLine("Engine start error: \(error)")
            return false
        }
    }

    func stop() -> Bool {
        logLine("stop called")
        if engine != nil {
            if engine.isRunning {
                engine.mainMixerNode.removeTap(onBus: 0)
                engine.inputNode.removeTap(onBus: 0)
                engine.stop()
                logLine("Engine stopped")
            }
        }
        if let stream = stream {
            stream.stopCapture { _ in }
            self.stream = nil
            logLine("SCStream stopped")
        }
        logLine("stop finished")
        return true
    }

    private func push(_ value: Float) {
        if count < bufferCapacity {
            buffer[tail] = value
            tail = (tail + 1) % bufferCapacity
            count += 1
        } else {
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
        SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: true) { content, error in
            if let error = error { logLine("SCShareableContent error: \(error)") }
            guard let content = content, let display = content.displays.first else {
                logLine("SCShareableContent missing content or display")
                return
            }
            let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
            let config = SCStreamConfiguration()
            config.capturesAudio = true
            config.sampleRate = 48000
            config.channelCount = 2
            config.showsCursor = false
            config.queueDepth = 5
            if #available(macOS 13.0, *) { config.excludesCurrentProcessAudio = false }

            do {
                self.stream = SCStream(filter: filter, configuration: config, delegate: nil)
                try self.stream?.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "com.ainimvp.audio.queue"))
                self.stream?.startCapture { error in
                    if let error = error { logLine("SCStream error: \(error)") }
                    else { logLine("SCStream startCapture ok") }
                }
            } catch { logLine("Stream creation error: \(error)") }
        }
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }
        let listSize = MemoryLayout<AudioBufferList>.size + MemoryLayout<AudioBuffer>.size
        let bufferListPointer = UnsafeMutableRawPointer.allocate(byteCount: listSize, alignment: MemoryLayout<AudioBufferList>.alignment)
        defer { bufferListPointer.deallocate() }
        let audioBufferList = bufferListPointer.bindMemory(to: AudioBufferList.self, capacity: 1)
        var blockBuffer: CMBlockBuffer?

        CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
            sampleBuffer, bufferListSizeNeededOut: nil, bufferListOut: audioBufferList,
            bufferListSize: listSize, blockBufferAllocator: nil, blockBufferMemoryAllocator: nil,
            flags: 0, blockBufferOut: &blockBuffer
        )

        let buffers = UnsafeMutableAudioBufferListPointer(audioBufferList)
        guard let formatDesc = CMSampleBufferGetFormatDescription(sampleBuffer),
              let asbdPtr = CMAudioFormatDescriptionGetStreamBasicDescription(formatDesc) else { return }
        let asbd = asbdPtr.pointee
        let channels = Int(asbd.mChannelsPerFrame)
        let isFloat = (asbd.mFormatFlags & kAudioFormatFlagIsFloat) != 0
        let bits = Int(asbd.mBitsPerChannel)

        bufferLock.lock()
        defer { bufferLock.unlock() }

        if buffers.count >= 2 && channels >= 2 {
            let frameCount = Int(buffers[0].mDataByteSize) / Int(asbd.mBytesPerFrame)
            if isFloat && bits == 32 {
                let mDataL = buffers[0].mData?.assumingMemoryBound(to: Float.self)
                let mDataR = buffers[1].mData?.assumingMemoryBound(to: Float.self)
                for i in 0..<frameCount { push(mDataL?[i] ?? 0); push(mDataR?[i] ?? 0) }
            }
        } else if buffers.count == 1 {
            let frameCount = Int(buffers[0].mDataByteSize) / Int(asbd.mBytesPerFrame)
            if isFloat && bits == 32 {
                let mData = buffers[0].mData?.assumingMemoryBound(to: Float.self)
                if channels >= 2 {
                    for i in 0..<frameCount { push(mData?[i*2] ?? 0); push(mData?[i*2+1] ?? 0) }
                } else {
                    for i in 0..<frameCount { let val = mData?[i] ?? 0; push(val); push(val) }
                }
            }
        }
    }
}
