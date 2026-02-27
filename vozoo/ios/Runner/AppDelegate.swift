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

    // Initialize RecorderService
    // Need to adjust RecorderService init signature to match if I changed it in previous step
    // Actually in previous step I used `init(messenger: FlutterBinaryMessenger)`
    // But I need to conform to FlutterStreamHandler signature properly or split it

    // Let's fix RecorderService.swift first to be correct, then update this.
    // For now, assume RecorderService is correct.

    // However, I see I used `@UIApplicationMain` in previous write, but modern Flutter uses `@main`.
    // Let's stick to what was there or `@main` if it's new project.
    // Since I overwrote it, I should be careful.
    // The previous read showed `@UIApplicationMain` because I overwrote it.
    // Let's use `@main` which is standard for newer Flutter/iOS.

    GeneratedPluginRegistrant.register(with: self)

    // Setup after plugin registration
    recorderService = RecorderService(messenger: controller.binaryMessenger)

    channel.setMethodCallHandler { [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) in
        self?.recorderService?.handle(call, result: result)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
