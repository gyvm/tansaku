// RootView.swift
// 記録画面と履歴画面をタブで切り替えるアプリのルートです。

import SwiftUI

struct RootView: View {
    @State private var selectedTab: AppTab = .record

    var body: some View {
        Group {
            switch selectedTab {
            case .record:
                RecordView()
            case .history:
                NavigationStack {
                    HistoryView()
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        // iOS 26の浮遊TabViewにコンテンツが隠れないよう、安全領域内に独自の小型ナビを置きます。
        .safeAreaInset(edge: .bottom, spacing: 0) {
            CompactTabBar(selection: $selectedTab)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 6)
                .background(SkiTheme.background.opacity(0.96))
        }
        .background(SkiTheme.background.ignoresSafeArea())
        .tint(SkiTheme.ice)
        .preferredColorScheme(.dark)
    }
}

private enum AppTab: Hashable {
    case record
    case history

    var title: String {
        switch self {
        case .record: "記録"
        case .history: "履歴"
        }
    }

    var systemImage: String {
        switch self {
        case .record: "speedometer"
        case .history: "chart.xyaxis.line"
        }
    }
}

private struct CompactTabBar: View {
    @Binding var selection: AppTab

    var body: some View {
        HStack(spacing: 4) {
            ForEach([AppTab.record, AppTab.history], id: \.self) { tab in
                Button {
                    selection = tab
                } label: {
                    Label(tab.title, systemImage: tab.systemImage)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .foregroundStyle(selection == tab ? SkiTheme.navy : SkiTheme.muted)
                        .background(selection == tab ? SkiTheme.ice : Color.clear)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityValue(selection == tab ? "選択中" : "")
            }
        }
        .padding(5)
        .background(SkiTheme.surfaceRaised)
        .clipShape(Capsule())
        .overlay {
            Capsule()
                .stroke(SkiTheme.ice.opacity(0.16), lineWidth: 1)
        }
    }
}

#Preview {
    RootView()
}
