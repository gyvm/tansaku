// Components.swift
// 記録一覧・詳細画面で共通利用する小さなUIコンポーネントです。

import Charts
import SwiftUI

struct StatusPill: View {
    let title: String
    let systemImage: String
    var tint: Color = SkiTheme.green

    var body: some View {
        Label(title, systemImage: systemImage)
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundStyle(tint)
            .padding(.horizontal, 11)
            .padding(.vertical, 8)
            .background(tint.opacity(0.12))
            .clipShape(Capsule())
            .accessibilityElement(children: .combine)
    }
}

struct Eyebrow: View {
    let title: String

    var body: some View {
        Text(title.uppercased())
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .tracking(1.5)
            .foregroundStyle(SkiTheme.muted)
    }
}

struct SectionHeader: View {
    let title: String
    var actionTitle: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(size: 21, weight: .bold, design: .rounded))
                .foregroundStyle(SkiTheme.snow)

            Spacer()

            if let actionTitle {
                Text(actionTitle)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(SkiTheme.ice)
            }
        }
    }
}

struct MetricTile: View {
    let title: String
    let value: String
    let unit: String?
    let systemImage: String
    var tint: Color = SkiTheme.ice

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 27, height: 27)
                .background(tint.opacity(0.13))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.snow)

                    if let unit {
                        Text(unit)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(SkiTheme.muted)
                    }
                }

                Text(title)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(SkiTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(SkiTheme.backgroundRaised)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct MiniSlopeStrip: View {
    let segments: [SlopeSegment]
    var height: CGFloat = 13

    var body: some View {
        GeometryReader { geometry in
            let gap = CGFloat(max(segments.count - 1, 0)) * 2
            let availableWidth = max(geometry.size.width - gap, 0)

            HStack(spacing: 2) {
                ForEach(segments) { segment in
                    RoundedRectangle(cornerRadius: height / 2, style: .continuous)
                        .fill(segment.band.color)
                        .frame(width: max(3, availableWidth * segment.fraction))
                }
            }
        }
        .frame(height: height)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("斜度プロファイル")
        .accessibilityValue("5段階の斜度区間")
    }
}

struct ProfileLegend: View {
    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), alignment: .leading), count: 3),
            alignment: .leading,
            spacing: 8
        ) {
            ForEach(SlopeBand.allCases) { band in
                HStack(spacing: 5) {
                    Circle()
                        .fill(band.color)
                        .frame(width: 7, height: 7)

                    Text(band.threshold)
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ElevationChart: View {
    let points: [ElevationPoint]

    var body: some View {
        Chart(points) { point in
            AreaMark(
                x: .value("距離", point.distance),
                y: .value("標高", point.elevation)
            )
            .interpolationMethod(.catmullRom)
            .foregroundStyle(
                LinearGradient(
                    colors: [SkiTheme.ice.opacity(0.42), SkiTheme.ice.opacity(0.02)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )

            LineMark(
                x: .value("距離", point.distance),
                y: .value("標高", point.elevation)
            )
            .interpolationMethod(.catmullRom)
            .foregroundStyle(SkiTheme.ice)
            .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
        .chartXAxis {
            AxisMarks(position: .bottom, values: .automatic(desiredCount: 4)) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [3, 4]))
                    .foregroundStyle(SkiTheme.divider)
                AxisTick().foregroundStyle(SkiTheme.divider)
                AxisValueLabel {
                    if let distance = value.as(Double.self) {
                        Text(String(format: "%.1f", distance))
                            .font(.system(size: 10, design: .rounded))
                            .foregroundStyle(SkiTheme.muted)
                    }
                }
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading, values: .automatic(desiredCount: 4)) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [3, 4]))
                    .foregroundStyle(SkiTheme.divider)
                AxisValueLabel {
                    if let elevation = value.as(Double.self) {
                        Text(String(format: "%.0f", elevation))
                            .font(.system(size: 10, design: .rounded))
                            .foregroundStyle(SkiTheme.muted)
                    }
                }
            }
        }
        .chartPlotStyle { plotArea in
            plotArea
                .background(SkiTheme.backgroundRaised.opacity(0.42))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .frame(height: 180)
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let explanation: String
    let systemImage: String
    var tint: Color = SkiTheme.ice

    var body: some View {
        HStack(spacing: 13) {
            Image(systemName: systemImage)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 38, height: 38)
                .background(tint.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(SkiTheme.muted)
                Text(value)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(SkiTheme.snow)
                Text(explanation)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(SkiTheme.muted.opacity(0.85))
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(SkiTheme.backgroundRaised)
        .clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
    }
}
