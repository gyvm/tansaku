// SkiTheme.swift
// Ski Logの配色、カード、ボタンをまとめたUIテーマです。

import SwiftUI

enum SkiTheme {
    static let background = Color(red: 0.035, green: 0.055, blue: 0.095)
    static let backgroundRaised = Color(red: 0.055, green: 0.085, blue: 0.135)
    static let surface = Color(red: 0.075, green: 0.115, blue: 0.175)
    static let surfaceRaised = Color(red: 0.105, green: 0.155, blue: 0.225)

    static let ice = Color(red: 0.42, green: 0.84, blue: 0.96)
    static let iceSoft = Color(red: 0.20, green: 0.48, blue: 0.64)
    static let snow = Color(red: 0.92, green: 0.97, blue: 1.00)
    static let muted = Color(red: 0.58, green: 0.67, blue: 0.75)
    static let divider = Color.white.opacity(0.10)

    static let amber = Color(red: 1.00, green: 0.69, blue: 0.23)
    static let red = Color(red: 0.98, green: 0.29, blue: 0.28)
    static let green = Color(red: 0.35, green: 0.86, blue: 0.61)
    static let navy = Color(red: 0.035, green: 0.055, blue: 0.095)
}

struct SkiCardModifier: ViewModifier {
    var padding: CGFloat = 18

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(SkiTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(SkiTheme.divider, lineWidth: 1)
            }
    }
}

extension View {
    func skiCard(padding: CGFloat = 18) -> some View {
        modifier(SkiCardModifier(padding: padding))
    }
}

struct SkiBackground<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        ZStack {
            SkiTheme.background.ignoresSafeArea()

            Circle()
                .fill(SkiTheme.ice.opacity(0.06))
                .frame(width: 320, height: 320)
                .blur(radius: 20)
                .offset(x: 170, y: -300)

            Circle()
                .fill(SkiTheme.amber.opacity(0.035))
                .frame(width: 260, height: 260)
                .blur(radius: 28)
                .offset(x: -170, y: 360)

            content()
        }
        // NavigationStackから固有サイズで配置されないよう、iPhoneの画面全体を使います。
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

struct SkiPrimaryButtonStyle: ButtonStyle {
    let isDestructive: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .bold, design: .rounded))
            .frame(maxWidth: .infinity, minHeight: 56)
            .foregroundStyle(isDestructive ? .white : SkiTheme.navy)
            .background(isDestructive ? SkiTheme.red : SkiTheme.ice)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(
                color: (isDestructive ? SkiTheme.red : SkiTheme.ice).opacity(configuration.isPressed ? 0.12 : 0.30),
                radius: configuration.isPressed ? 4 : 16,
                y: configuration.isPressed ? 2 : 8
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
