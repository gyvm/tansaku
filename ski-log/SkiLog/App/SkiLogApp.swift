// SkiLogApp.swift
// Ski Log UIモックのエントリーポイントです。

import SwiftUI

@main
struct SkiLogApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        // iPhone 17シミュレータのウィンドウ起動時も、実機相当の縦領域を初期値にします。
        .defaultSize(width: 402, height: 874)
    }
}
