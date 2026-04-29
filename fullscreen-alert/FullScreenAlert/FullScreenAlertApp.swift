import SwiftUI

@main
struct FullScreenAlertApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            if !appDelegate.isNotificationMode {
                SettingsView()
            }
        }
        .defaultSize(width: 420, height: 340)
    }
}
