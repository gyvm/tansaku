import SwiftUI

struct SettingsView: View {
    @AppStorage("defaultTitle") private var title = AlertParameters.fallbackTitle
    @AppStorage("defaultMessage") private var message = AlertParameters.fallbackMessage
    @AppStorage("defaultColorHex") private var colorHex = AlertParameters.fallbackColorHex
    @AppStorage("displayTarget") private var displayTarget = DisplayTarget.mainOnly.rawValue

    @State private var pickerColor: Color = .red

    var body: some View {
        Form {
            Section("デフォルト値") {
                TextField("タイトル", text: $title)
                TextField("メッセージ", text: $message)

                HStack {
                    TextField("背景色 (HEX)", text: $colorHex)
                        .frame(width: 150)
                    ColorPicker("", selection: $pickerColor, supportsOpacity: false)
                        .labelsHidden()
                        .onChange(of: pickerColor) { newValue in
                            colorHex = newValue.toHex()
                        }
                }
            }

            Section("表示ディスプレイ") {
                Picker("", selection: $displayTarget) {
                    Text("メインディスプレイのみ").tag(DisplayTarget.mainOnly.rawValue)
                    Text("全ディスプレイ").tag(DisplayTarget.allDisplays.rawValue)
                }
                .pickerStyle(.radioGroup)
                .labelsHidden()
            }

            Section {
                Button("プレビュー") {
                    let params = AlertParameters(
                        title: title,
                        message: message.isEmpty ? "プレビュー表示" : message,
                        colorHex: colorHex,
                        displayTarget: DisplayTarget(rawValue: displayTarget) ?? .mainOnly
                    )
                    AlertWindowController.shared.showAlert(params: params)
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 420, height: 340)
        .onAppear {
            pickerColor = Color(nsColor: NSColor(hex: colorHex) ?? .systemRed)
        }
        .onChange(of: colorHex) { newValue in
            if let c = NSColor(hex: newValue) {
                pickerColor = Color(nsColor: c)
            }
        }
    }
}

extension Color {
    func toHex() -> String {
        guard let components = NSColor(self).usingColorSpace(.sRGB)?.cgColor.components,
              components.count >= 3 else {
            return "#FF4444"
        }
        let r = Int(components[0] * 255)
        let g = Int(components[1] * 255)
        let b = Int(components[2] * 255)
        return String(format: "#%02X%02X%02X", r, g, b)
    }
}
