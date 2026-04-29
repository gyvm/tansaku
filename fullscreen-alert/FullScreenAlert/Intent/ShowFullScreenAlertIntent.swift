import AppIntents
import AppKit

@available(macOS 13.0, *)
struct ShowFullScreenAlertIntent: AppIntent {
    static var title: LocalizedStringResource = "全画面通知を表示"
    static var description = IntentDescription("全画面に通知を表示します")

    @Parameter(title: "タイトル")
    var alertTitle: String?

    @Parameter(title: "メッセージ")
    var alertMessage: String?

    @Parameter(title: "背景色 (HEX)")
    var alertColor: String?

    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        let defaults = AlertParameters.loadDefaults()
        let params = AlertParameters(
            title: alertTitle?.isEmpty == false ? alertTitle! : defaults.title,
            message: alertMessage?.isEmpty == false ? alertMessage! : defaults.message,
            colorHex: alertColor?.isEmpty == false ? alertColor! : defaults.colorHex,
            displayTarget: defaults.displayTarget
        )

        NSApp.setActivationPolicy(.accessory)
        AlertWindowController.shared.showAlert(params: params, terminateOnClose: true)

        return .result()
    }
}

@available(macOS 13.0, *)
struct FullScreenAlertShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ShowFullScreenAlertIntent(),
            phrases: [
                "全画面通知を表示 \(.applicationName)",
                "Show alert \(.applicationName)"
            ],
            shortTitle: "全画面通知",
            systemImageName: "exclamationmark.triangle.fill"
        )
    }
}
