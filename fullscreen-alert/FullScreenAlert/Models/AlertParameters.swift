import Foundation
import AppKit

enum DisplayTarget: String, CaseIterable {
    case mainOnly = "main"
    case allDisplays = "all"
}

struct AlertParameters {
    var title: String
    var message: String
    var colorHex: String
    var displayTarget: DisplayTarget

    static let fallbackTitle = "Alert"
    static let fallbackMessage = ""
    static let fallbackColorHex = "#FF4444"
    static let fallbackDisplayTarget = DisplayTarget.mainOnly

    static func loadDefaults() -> AlertParameters {
        let ud = UserDefaults.standard
        return AlertParameters(
            title: ud.string(forKey: "defaultTitle") ?? fallbackTitle,
            message: ud.string(forKey: "defaultMessage") ?? fallbackMessage,
            colorHex: ud.string(forKey: "defaultColorHex") ?? fallbackColorHex,
            displayTarget: DisplayTarget(rawValue: ud.string(forKey: "displayTarget") ?? "") ?? fallbackDisplayTarget
        )
    }

    static func saveDefaults(_ params: AlertParameters) {
        let ud = UserDefaults.standard
        ud.set(params.title, forKey: "defaultTitle")
        ud.set(params.message, forKey: "defaultMessage")
        ud.set(params.colorHex, forKey: "defaultColorHex")
        ud.set(params.displayTarget.rawValue, forKey: "displayTarget")
    }

    var nsColor: NSColor {
        NSColor(hex: colorHex) ?? NSColor.systemRed
    }
}

extension NSColor {
    convenience init?(hex: String) {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexString.hasPrefix("#") {
            hexString.removeFirst()
        }
        guard hexString.count == 6 else { return nil }
        var rgb: UInt64 = 0
        guard Scanner(string: hexString).scanHexInt64(&rgb) else { return nil }
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255.0,
            green: CGFloat((rgb >> 8) & 0xFF) / 255.0,
            blue: CGFloat(rgb & 0xFF) / 255.0,
            alpha: 1.0
        )
    }
}
