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

    logLine("check_permissions mic=\(((status & 1) != 0)) screen=\(((status & 2) != 0))")

    return status
}

@_cdecl("request_permissions")
public func request_permissions() {
    logLine("request_permissions")
    AVCaptureDevice.requestAccess(for: .audio) { _ in }
    // CGRequestScreenCaptureAccess available macOS 11.0+
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
    private var sysBufferCount = 0
    private var sysPeak: Float = 0
    private var micBufferCount = 0
    private var micPeak: Float = 0
    private var micFormatLogged = false
    private var tapFormatLogged = false

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

        logLine("engine format sr=\(format.sampleRate) ch=\(format.channelCount)")
        engine.mainMixerNode.outputVolume = 1.0

        // Setup File
        let url = URL(fileURLWithPath: path)
        let directory = url.deletingLastPathComponent()
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
            file = try AVAudioFile(forWriting: url, settings: format.settings)
        } catch {
            print("Failed to create file: \(error)")
            logLine("Failed to create file: \(error)")
            return false
        }

        // Setup Mic
        if includeMic {
            let input = engine.inputNode
            let inputFormat = input.inputFormat(forBus: 0)
            if inputFormat.channelCount > 0 {
                logLine("mic input format sr=\(inputFormat.sampleRate) ch=\(inputFormat.channelCount)")
                engine.connect(input, to: engine.mainMixerNode, format: inputFormat)
                input.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, _ in
                    guard let self = self else { return }
                    if !self.micFormatLogged {
                        self.micFormatLogged = true
                        logLine("mic tap format common=\(buffer.format.commonFormat) interleaved=\(buffer.format.isInterleaved) ch=\(buffer.format.channelCount)")
                    }
                    let frameLength = Int(buffer.frameLength)
                    if let channelData = buffer.floatChannelData {
                        for ch in 0..<Int(buffer.format.channelCount) {
                            let data = channelData[ch]
                            for i in 0..<frameLength {
                                let v = fabsf(data[i])
                                if v > self.micPeak { self.micPeak = v }
                            }
                        }
                    } else if let channelData = buffer.int16ChannelData {
                        let scale = Float(Int16.max)
                        for ch in 0..<Int(buffer.format.channelCount) {
                            let data = channelData[ch]
                            for i in 0..<frameLength {
                                let v = fabsf(Float(data[i]) / scale)
                                if v > self.micPeak { self.micPeak = v }
                            }
                        }
                    } else if let channelData = buffer.int32ChannelData {
                        let scale = Float(Int32.max)
                        for ch in 0..<Int(buffer.format.channelCount) {
                            let data = channelData[ch]
                            for i in 0..<frameLength {
                                let v = fabsf(Float(data[i]) / scale)
                                if v > self.micPeak { self.micPeak = v }
                            }
                        }
                    }
                    self.micBufferCount += 1
                    if self.micBufferCount % 50 == 0 {
                        logLine("mic buffers=\(self.micBufferCount) peak=\(self.micPeak)")
                        self.micPeak = 0
                    }
                }
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
                let frameLength = Int(buffer.frameLength)
                if let channelData = buffer.floatChannelData {
                    for ch in 0..<Int(buffer.format.channelCount) {
                        let data = channelData[ch]
                        for i in 0..<frameLength {
                            let v = fabsf(data[i])
                            if v > self.tapPeak { self.tapPeak = v }
                        }
                    }
                }
                self.tapBufferCount += 1
                if self.tapBufferCount % 50 == 0 {
                    logLine("tap buffers=\(self.tapBufferCount) peak=\(self.tapPeak)")
                    self.tapPeak = 0
                }
                try self.file.write(from: buffer)
            } catch {
                print("Write error: \(error)")
                logLine("Write error: \(error)")
            }
        }

        do {
            try engine.start()
            logLine("engine started")
            return true
        } catch {
            print("Engine start error: \(error)")
            logLine("Engine start error: \(error)")
            return false
        }
    }

    func stop() -> Bool {
        if engine.isRunning {
            engine.stop()
            engine.mainMixerNode.removeTap(onBus: 0)
            engine.inputNode.removeTap(onBus: 0)
        }
        if let stream = stream {
            stream.stopCapture { _ in }
            self.stream = nil
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
        SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: true) { content, error in
            if let error = error {
                logLine("SCShareableContent error: \(error)")
            }
            guard let content = content else {
                logLine("SCShareableContent missing content")
                return
            }
            guard let display = content.displays.first else {
                logLine("SCShareableContent missing display")
                return
            }

            let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
            let config = SCStreamConfiguration()
            config.capturesAudio = true
            config.sampleRate = 48000
            config.channelCount = 2
            config.showsCursor = false
            config.queueDepth = 5 // Keep latency low

            do {
                self.stream = SCStream(filter: filter, configuration: config, delegate: nil)
                try self.stream?.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "com.ainimvp.audio.queue"))
                self.stream?.startCapture { error in
                    if let error = error {
                        print("SCStream error: \(error)")
                        logLine("SCStream error: \(error)")
                    } else {
                        logLine("SCStream startCapture ok")
                    }
                }
            } catch {
                print("Stream creation error: \(error)")
                logLine("Stream creation error: \(error)")
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
        guard let formatDesc = CMSampleBufferGetFormatDescription(sampleBuffer),
              let asbdPtr = CMAudioFormatDescriptionGetStreamBasicDescription(formatDesc) else {
            logLine("sys audio missing format description")
            return
        }
        let asbd = asbdPtr.pointee
        let channels = Int(asbd.mChannelsPerFrame)
        let isFloat = (asbd.mFormatFlags & kAudioFormatFlagIsFloat) != 0
        let isBigEndian = (asbd.mFormatFlags & kAudioFormatFlagIsBigEndian) != 0
        let bitsPerChannel = Int(asbd.mBitsPerChannel)
        if isBigEndian {
            logLine("sys audio big endian not supported")
            return
        }

        sysBufferCount += 1
        if sysBufferCount % 60 == 1 {
            logLine("sys audio asbd sr=\(asbd.mSampleRate) ch=\(channels) bits=\(bitsPerChannel) float=\(isFloat) buffers=\(buffers.count)")
        }

        bufferLock.lock()
        defer { bufferLock.unlock() }

        if buffers.count >= 2 && channels >= 2 {
            let frameCount = Int(buffers[0].mDataByteSize) / Int(asbd.mBytesPerFrame)
            if isFloat && bitsPerChannel == 32 {
                let mDataL = buffers[0].mData?.assumingMemoryBound(to: Float.self)
                let mDataR = buffers[1].mData?.assumingMemoryBound(to: Float.self)
                for i in 0..<frameCount {
                    let l = mDataL?[i] ?? 0
                    let r = mDataR?[i] ?? 0
                    if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                    if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                    push(l)
                    push(r)
                }
            } else if !isFloat && bitsPerChannel == 16 {
                let mDataL = buffers[0].mData?.assumingMemoryBound(to: Int16.self)
                let mDataR = buffers[1].mData?.assumingMemoryBound(to: Int16.self)
                let scale = Float(Int16.max)
                for i in 0..<frameCount {
                    let l = Float(mDataL?[i] ?? 0) / scale
                    let r = Float(mDataR?[i] ?? 0) / scale
                    if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                    if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                    push(l)
                    push(r)
                }
            } else if !isFloat && bitsPerChannel == 32 {
                let mDataL = buffers[0].mData?.assumingMemoryBound(to: Int32.self)
                let mDataR = buffers[1].mData?.assumingMemoryBound(to: Int32.self)
                let scale = Float(Int32.max)
                for i in 0..<frameCount {
                    let l = Float(mDataL?[i] ?? 0) / scale
                    let r = Float(mDataR?[i] ?? 0) / scale
                    if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                    if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                    push(l)
                    push(r)
                }
            }
        } else if buffers.count == 1 {
            let frameCount = Int(buffers[0].mDataByteSize) / Int(asbd.mBytesPerFrame)
            if isFloat && bitsPerChannel == 32 {
                let mData = buffers[0].mData?.assumingMemoryBound(to: Float.self)
                if channels >= 2 {
                    for i in 0..<frameCount {
                        let base = i * channels
                        let l = mData?[base] ?? 0
                        let r = mData?[base + 1] ?? 0
                        if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                        if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                        push(l)
                        push(r)
                    }
                } else {
                    for i in 0..<frameCount {
                        let val = mData?[i] ?? 0
                        if fabsf(val) > sysPeak { sysPeak = fabsf(val) }
                        push(val)
                        push(val)
                    }
                }
            } else if !isFloat && bitsPerChannel == 16 {
                let mData = buffers[0].mData?.assumingMemoryBound(to: Int16.self)
                let scale = Float(Int16.max)
                if channels >= 2 {
                    for i in 0..<frameCount {
                        let base = i * channels
                        let l = Float(mData?[base] ?? 0) / scale
                        let r = Float(mData?[base + 1] ?? 0) / scale
                        if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                        if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                        push(l)
                        push(r)
                    }
                } else {
                    for i in 0..<frameCount {
                        let val = Float(mData?[i] ?? 0) / scale
                        if fabsf(val) > sysPeak { sysPeak = fabsf(val) }
                        push(val)
                        push(val)
                    }
                }
            } else if !isFloat && bitsPerChannel == 32 {
                let mData = buffers[0].mData?.assumingMemoryBound(to: Int32.self)
                let scale = Float(Int32.max)
                if channels >= 2 {
                    for i in 0..<frameCount {
                        let base = i * channels
                        let l = Float(mData?[base] ?? 0) / scale
                        let r = Float(mData?[base + 1] ?? 0) / scale
                        if fabsf(l) > sysPeak { sysPeak = fabsf(l) }
                        if fabsf(r) > sysPeak { sysPeak = fabsf(r) }
                        push(l)
                        push(r)
                    }
                } else {
                    for i in 0..<frameCount {
                        let val = Float(mData?[i] ?? 0) / scale
                        if fabsf(val) > sysPeak { sysPeak = fabsf(val) }
                        push(val)
                        push(val)
                    }
                }
            }
        }

        if sysBufferCount % 60 == 0 {
            logLine("sys audio peak=\(sysPeak)")
            sysPeak = 0
        }
    }
}
