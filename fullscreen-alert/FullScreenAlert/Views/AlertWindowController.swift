import AppKit
import SwiftUI

final class AlertWindowController {
    static let shared = AlertWindowController()
    private var windows: [NSWindow] = []
    private(set) var isShowing = false
    private var shouldTerminateOnClose = false

    func showAlert(params: AlertParameters, terminateOnClose: Bool = false) {
        self.shouldTerminateOnClose = terminateOnClose
        self.isShowing = true

        let screens: [NSScreen]
        switch params.displayTarget {
        case .mainOnly:
            screens = [NSScreen.main ?? NSScreen.screens[0]]
        case .allDisplays:
            screens = NSScreen.screens
        }

        for screen in screens {
            let window = NSWindow(
                contentRect: screen.frame,
                styleMask: .borderless,
                backing: .buffered,
                defer: false,
                screen: screen
            )
            window.level = .screenSaver
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            window.isOpaque = true
            window.hasShadow = false
            window.setFrame(screen.frame, display: true)
            window.contentView = NSHostingView(
                rootView: AlertView(params: params, onClose: { [weak self] in
                    self?.closeAll()
                })
            )
            window.makeKeyAndOrderFront(nil)
            windows.append(window)
        }

        NSApp.activate(ignoringOtherApps: true)
    }

    func ownsWindow(_ window: NSWindow) -> Bool {
        windows.contains(window)
    }

    func closeAll() {
        // ボタンのアクションハンドラ完了後にウィンドウを閉じる
        // (ハンドラ中にビューが解放されるとEXC_BAD_ACCESSになるため)
        let windowsToClose = windows
        let terminate = shouldTerminateOnClose
        windows.removeAll()
        isShowing = false

        DispatchQueue.main.async {
            for window in windowsToClose {
                window.orderOut(nil)
            }
            if terminate {
                NSApp.terminate(nil)
            }
        }
    }
}
