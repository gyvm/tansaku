// HistoryView.swift
// 過去の滑走を斜度プロファイル付きで一覧表示する画面です。

import SwiftUI

struct HistoryView: View {
    private let sessions = MockData.sessions

    var body: some View {
        SkiBackground {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    seasonSummary

                    SectionHeader(title: "最近の記録", actionTitle: "3件")

                    LazyVStack(spacing: 12) {
                        ForEach(sessions) { session in
                            NavigationLink(value: session.id) {
                                SessionRow(session: session)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Label("色の帯は斜度の変化を表します", systemImage: "info.circle")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(SkiTheme.muted)
                        ProfileLegend()
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 20)
            }
        }
        .navigationTitle("滑走履歴")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: UUID.self) { sessionID in
            if let session = sessions.first(where: { $0.id == sessionID }) {
                SessionDetailView(session: session)
            }
        }
    }

    private var seasonSummary: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Eyebrow(title: "2025 / 26 season")
                    Text("滑走のクセが見えてきた")
                        .font(.system(size: 21, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.snow)
                }
                Spacer()
                Image(systemName: "mountain.2.fill")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(SkiTheme.ice)
            }

            HStack(spacing: 0) {
                seasonValue(value: "11.37", unit: "km", title: "総滑走距離")
                Divider().frame(height: 42).overlay(SkiTheme.divider)
                seasonValue(value: "1,933", unit: "m", title: "総標高差")
                Divider().frame(height: 42).overlay(SkiTheme.divider)
                seasonValue(value: "27.4", unit: "°", title: "最大斜度")
            }
        }
        .padding(16)
        .background(
            LinearGradient(
                colors: [SkiTheme.iceSoft.opacity(0.68), SkiTheme.surface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 27, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 27, style: .continuous)
                .stroke(SkiTheme.ice.opacity(0.22), lineWidth: 1)
        }
    }

    private func seasonValue(value: String, unit: String, title: String) -> some View {
        VStack(spacing: 3) {
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                Text(unit)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
            }
            .foregroundStyle(SkiTheme.snow)

            Text(title)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(SkiTheme.muted)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct SessionRow: View {
    let session: MockSession

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(session.course)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.snow)
                    Text(session.resort)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(session.date, format: .dateTime.month(.defaultDigits).day(.defaultDigits))
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(SkiTheme.muted.opacity(0.7))
                }
            }

            MiniSlopeStrip(segments: session.segments, height: 13)

            HStack(spacing: 0) {
                rowValue(title: "距離", value: String(format: "%.2f km", session.distanceKm))
                rowValue(title: "標高差", value: "−\(session.elevationDrop)m")
                rowValue(title: "最大斜度", value: String(format: "%.1f°", session.maxSlope))
            }
        }
        .skiCard(padding: 14)
    }

    private func rowValue(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(SkiTheme.muted)
            Text(value)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(SkiTheme.snow)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    NavigationStack {
        HistoryView()
    }
}
