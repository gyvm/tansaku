// SessionDetailView.swift
// 1本の滑走について、標高・斜度・指標・軌跡をまとめて見せる画面です。

import MapKit
import SwiftUI

struct SessionDetailView: View {
    let session: MockSession

    var body: some View {
        SkiBackground {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    sessionHeader
                    summaryMetrics
                    elevationSection
                    slopeSection
                    metricsSection
                    routeSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 20)
            }
        }
        .navigationTitle("滑走詳細")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(
                    item: exportText,
                    subject: Text("Ski Logの滑走記録"),
                    message: Text("\(session.course)のモックデータ")
                ) {
                    Image(systemName: "square.and.arrow.up")
                        .accessibilityLabel("記録を共有")
                }
            }
        }
    }

    private var sessionHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Eyebrow(title: session.resort)
                    Text(session.course)
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(SkiTheme.snow)
                    Text(session.date, format: .dateTime.year().month().day().hour().minute())
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(SkiTheme.muted)
                }

                Spacer()

                Image(systemName: "mountain.2.fill")
                    .font(.system(size: 23, weight: .bold))
                    .foregroundStyle(SkiTheme.ice)
            }

            MiniSlopeStrip(segments: session.segments, height: 17)

            HStack {
                Text("緩")
                Spacer()
                Text("急")
            }
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(SkiTheme.muted)
        }
        .skiCard(padding: 16)
    }

    private var summaryMetrics: some View {
        HStack(spacing: 10) {
            MetricTile(title: "滑走距離", value: String(format: "%.2f", session.distanceKm), unit: "km", systemImage: "arrow.down.right", tint: SkiTheme.ice)
            MetricTile(title: "標高差", value: "−\(session.elevationDrop)", unit: "m", systemImage: "mountain.2", tint: SkiTheme.green)
            MetricTile(title: "最大斜度", value: String(format: "%.1f", session.maxSlope), unit: "°", systemImage: "exclamationmark.triangle", tint: SkiTheme.amber)
        }
    }

    private var elevationSection: some View {
        VStack(alignment: .leading, spacing: 11) {
            SectionHeader(title: "標高プロファイル", actionTitle: "m")
            ElevationChart(points: session.elevationPoints)
                .padding(.horizontal, 2)
        }
    }

    private var slopeSection: some View {
        VStack(alignment: .leading, spacing: 11) {
            SectionHeader(title: "斜度プロファイル", actionTitle: "10m間隔")

            VStack(alignment: .leading, spacing: 10) {
                MiniSlopeStrip(segments: session.segments, height: 22)
                ProfileLegend()
            }
            .skiCard(padding: 14)
        }
    }

    private var metricsSection: some View {
        VStack(alignment: .leading, spacing: 11) {
            SectionHeader(title: "体感に効く指標")

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                MetricCard(
                    title: "20°超の連続",
                    value: String(format: "%.0f m", session.sustainedSteep),
                    explanation: "急斜面が続いた距離",
                    systemImage: "chart.line.uptrend.xyaxis",
                    tint: SkiTheme.red
                )
                MetricCard(
                    title: "緩斜面率",
                    value: "\(session.gentleRatio)%",
                    explanation: "12°未満の割合",
                    systemImage: "leaf.fill",
                    tint: SkiTheme.green
                )
                MetricCard(
                    title: "中央値",
                    value: "16.8°",
                    explanation: "斜度分布の中央",
                    systemImage: "arrow.left.and.right",
                    tint: SkiTheme.ice
                )
                MetricCard(
                    title: "90パーセンタイル",
                    value: "23.1°",
                    explanation: "上位10%の斜度",
                    systemImage: "waveform.path.ecg",
                    tint: SkiTheme.amber
                )
            }
        }
    }

    private var routeSection: some View {
        VStack(alignment: .leading, spacing: 11) {
            SectionHeader(title: "軌跡", actionTitle: "MapKit")

            RouteMapPreview(coordinates: session.route)
                .frame(height: 210)
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(SkiTheme.ice.opacity(0.16), lineWidth: 1)
                }
        }
    }

    private var exportText: String {
        """
        {
          "course": "\(session.course)",
          "resort": "\(session.resort)",
          "distanceKm": \(session.distanceKm),
          "elevationDropM": \(session.elevationDrop),
          "maxSlopeDegrees": \(session.maxSlope)
        }
        """
    }
}

private struct RouteMapPreview: View {
    let coordinates: [CLLocationCoordinate2D]
    @State private var position: MapCameraPosition

    init(coordinates: [CLLocationCoordinate2D]) {
        self.coordinates = coordinates
        let center = coordinates.first ?? CLLocationCoordinate2D(latitude: 36.72, longitude: 137.84)
        let region = MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(latitudeDelta: 0.022, longitudeDelta: 0.025)
        )
        _position = State(initialValue: .region(region))
    }

    var body: some View {
        Map(position: $position) {
            MapPolyline(coordinates: coordinates)
                .stroke(SkiTheme.ice, lineWidth: 4)
        }
        .mapStyle(.standard(elevation: .realistic))
    }
}

#Preview {
    NavigationStack {
        SessionDetailView(session: MockData.sessions[0])
    }
}
