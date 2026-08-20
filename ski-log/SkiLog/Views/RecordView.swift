// RecordView.swift
// iPhone 17の縦画面に合わせ、現在値と記録操作を1画面へ収めた記録画面です。

import Combine
import SwiftUI

struct RecordView: View {
    @State private var isRecording = false
    @State private var startedAt = Date()
    @State private var currentTime = Date()

    private let latestSession = MockData.sessions[0]
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        SkiBackground {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 13) {
                    appHeader
                    recordHeader

                    Button {
                        if isRecording == false {
                            startedAt = currentTime
                        }
                        isRecording.toggle()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: isRecording ? "stop.fill" : "record.circle.fill")
                                .font(.system(size: 21, weight: .bold))
                            Text(isRecording ? "記録を停止" : "記録を開始")
                        }
                    }
                    .buttonStyle(SkiPrimaryButtonStyle(isDestructive: isRecording))
                    .accessibilityLabel(isRecording ? "記録を停止" : "記録を開始")

                    liveReadout
                    summarySection
                    profileCard
                    sensorStatus
                }
                .padding(.horizontal, 16)
                .padding(.top, 7)
                .padding(.bottom, 20)
            }
        }
        .onReceive(timer) { currentTime = $0 }
    }

    private var appHeader: some View {
        HStack {
            Text("SKI LOG")
                .font(.system(size: 13, weight: .black, design: .rounded))
                .tracking(2.4)
                .foregroundStyle(SkiTheme.snow)

            Spacer()

            Image(systemName: "snowflake")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(SkiTheme.ice)
                .frame(width: 32, height: 32)
                .background(SkiTheme.ice.opacity(0.12))
                .clipShape(Circle())
                .accessibilityHidden(true)
        }
        .frame(minHeight: 32)
    }

    private var recordHeader: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Eyebrow(title: "Slope intelligence")
                Text(isRecording ? "滑走を記録中" : "滑走を記録する")
                    .font(.system(size: 23, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.snow)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }

            Spacer(minLength: 4)

            StatusPill(
                title: isRecording ? "LIVE" : "READY",
                systemImage: isRecording ? "circle.fill" : "checkmark.seal.fill",
                tint: isRecording ? SkiTheme.red : SkiTheme.green
            )
        }
    }

    private var liveReadout: some View {
        VStack(spacing: 9) {
            HStack(spacing: 12) {
                slopeDial

                VStack(alignment: .leading, spacing: 7) {
                    liveValue(title: "経過時間", value: liveDuration, systemImage: "clock")
                    liveValue(title: "累積標高差", value: isRecording ? "+1,204 m" : "—", systemImage: "mountain.2")
                    liveValue(title: "高度ソース", value: "気圧センサー", systemImage: "barometer")
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            HStack(spacing: 6) {
                liveChip(title: "速度", value: isRecording ? "42.8" : "—", unit: "km/h")
                liveChip(title: "現在標高", value: isRecording ? "1,831" : "—", unit: "m")
                liveChip(title: "精度", value: "高", unit: nil)
            }
        }
        .padding(12)
        .background(
            LinearGradient(
                colors: [SkiTheme.surfaceRaised, SkiTheme.surface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(SkiTheme.ice.opacity(0.16), lineWidth: 1)
        }
    }

    private var slopeDial: some View {
        ZStack {
            Circle()
                .stroke(SkiTheme.ice.opacity(0.15), lineWidth: 9)
            Circle()
                .trim(from: 0, to: isRecording ? 0.72 : 0.04)
                .stroke(
                    AngularGradient(colors: [SkiTheme.ice, SkiTheme.green, SkiTheme.amber], center: .center),
                    style: StrokeStyle(lineWidth: 9, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            VStack(spacing: 1) {
                Text(isRecording ? "18.4" : "—")
                    .font(.system(size: 29, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.snow)
                Text("現在斜度 °")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.muted)
            }
        }
        .frame(width: 106, height: 106)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("現在斜度")
        .accessibilityValue(isRecording ? "18.4度" : "未計測")
    }

    private func liveValue(title: String, value: String, systemImage: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(SkiTheme.ice)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 9, weight: .semibold, design: .rounded))
                    .foregroundStyle(SkiTheme.muted)
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.snow)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
        }
    }

    private func liveChip(title: String, value: String, unit: String?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .foregroundStyle(SkiTheme.muted)

            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.snow)
                if let unit {
                    Text(unit)
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(SkiTheme.backgroundRaised.opacity(0.82))
        .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
    }

    private var summarySection: some View {
        VStack(alignment: .leading, spacing: 9) {
            SectionHeader(title: "今回のサマリー", actionTitle: "プレビュー")

            HStack(spacing: 8) {
                MetricTile(
                    title: "滑走時間",
                    value: isRecording ? liveDuration : latestSession.duration,
                    unit: nil,
                    systemImage: "timer",
                    tint: SkiTheme.ice
                )
                MetricTile(
                    title: "前回の速度",
                    value: isRecording ? "42.8" : "—",
                    unit: isRecording ? "km/h" : nil,
                    systemImage: "arrow.up.right",
                    tint: SkiTheme.green
                )
            }
        }
    }

    private var profileCard: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("前回の斜度プロファイル")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.snow)
                    Text(latestSession.course)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(SkiTheme.muted)
            }

            MiniSlopeStrip(segments: latestSession.segments, height: 16)

            HStack {
                Label("最大 \(latestSession.maxSlope, specifier: "%.1f")°", systemImage: "arrow.up.right")
                Spacer()
                Text("\(latestSession.distanceKm, specifier: "%.2f") km")
            }
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundStyle(SkiTheme.muted)
        }
        .skiCard(padding: 14)
    }

    private var sensorStatus: some View {
        HStack(spacing: 9) {
            Image(systemName: "checkmark.shield.fill")
                .foregroundStyle(SkiTheme.green)
            Text("気圧高度センサーの準備ができています")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(SkiTheme.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Spacer(minLength: 4)
            Text("準備OK")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(SkiTheme.green)
        }
        .padding(.horizontal, 12)
        .frame(minHeight: 44)
        .background(SkiTheme.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var liveDuration: String {
        guard isRecording else { return "00:00" }
        let seconds = max(0, Int(currentTime.timeIntervalSince(startedAt)))
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

#Preview {
    NavigationStack {
        RecordView()
    }
}
