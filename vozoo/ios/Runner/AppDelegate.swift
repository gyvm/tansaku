import UIKit
import Flutter
import AVFoundation

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var recorderService: RecorderService?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let channel = FlutterMethodChannel(name: "com.example.vozoo/recorder",
                                       binaryMessenger: controller.binaryMessenger)

    configureAudioSession()

    GeneratedPluginRegistrant.register(with: self)

    // Setup after plugin registration
    recorderService = RecorderService(messenger: controller.binaryMessenger)

    channel.setMethodCallHandler { [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) in
        self?.recorderService?.handle(call, result: result)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func configureAudioSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(
        .playAndRecord,
        mode: .default,
        options: [.defaultToSpeaker, .allowBluetooth]
      )
      try session.setPreferredSampleRate(48_000)
      try session.setPreferredIOBufferDuration(0.01)
      try session.setActive(true)
      session.requestRecordPermission { granted in
        if !granted {
          NSLog("Microphone permission was not granted")
        }
      }
    } catch {
      NSLog("Failed to configure AVAudioSession: \(error.localizedDescription)")
    }
  }
}
