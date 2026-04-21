import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private(set) var isNotificationMode = false

    func applicationWillFinishLaunching(_ notification: Notification) {
        if CLIArgumentParser.parse() != nil {
            isNotificationMode = true
            NSApp.setActivationPolicy(.accessory)
        } else {
            NSApp.setActivationPolicy(.regular)
        }
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let params = CLIArgumentParser.parse() else { return }

        DispatchQueue.main.async {
            for window in NSApp.windows where !AlertWindowController.shared.ownsWindow(window) {
                window.close()
            }
        }

        AlertWindowController.shared.showAlert(params: params, terminateOnClose: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
}
