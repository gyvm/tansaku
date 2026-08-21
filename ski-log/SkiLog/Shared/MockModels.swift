// MockModels.swift
// UIモック専用の記録データです。実装版ではSwiftDataモデルに置き換えます。

import CoreLocation
import SwiftUI

enum SlopeBand: String, CaseIterable, Identifiable {
    case gentle
    case rolling
    case steep
    case verySteep
    case extreme

    var id: String { rawValue }

    var title: String {
        switch self {
        case .gentle: "ゆるやか"
        case .rolling: "中斜面"
        case .steep: "急斜面"
        case .verySteep: "かなり急"
        case .extreme: "超急斜面"
        }
    }

    var color: Color {
        switch self {
        case .gentle: Color(red: 0.27, green: 0.78, blue: 0.73)
        case .rolling: Color(red: 0.40, green: 0.77, blue: 0.91)
        case .steep: Color(red: 0.99, green: 0.78, blue: 0.25)
        case .verySteep: Color(red: 1.00, green: 0.47, blue: 0.22)
        case .extreme: Color(red: 0.97, green: 0.27, blue: 0.34)
        }
    }

    var threshold: String {
        switch self {
        case .gentle: "< 12°"
        case .rolling: "12–16°"
        case .steep: "16–20°"
        case .verySteep: "20–24°"
        case .extreme: "24°+"
        }
    }
}

struct SlopeSegment: Identifiable {
    let id = UUID()
    let fraction: CGFloat
    let band: SlopeBand
    let degrees: Double
}

struct ElevationPoint: Identifiable {
    let id = UUID()
    let distance: Double
    let elevation: Double
}

struct MockSession: Identifiable {
    let id: UUID
    let date: Date
    let resort: String
    let course: String
    let distanceKm: Double
    let elevationDrop: Int
    let maxSlope: Double
    let sustainedSteep: Double
    let gentleRatio: Int
    let duration: String
    let topElevation: Int
    let bottomElevation: Int
    let segments: [SlopeSegment]
    let elevationPoints: [ElevationPoint]
    let route: [CLLocationCoordinate2D]

    init(
        id: UUID = UUID(),
        date: Date,
        resort: String,
        course: String,
        distanceKm: Double,
        elevationDrop: Int,
        maxSlope: Double,
        sustainedSteep: Double,
        gentleRatio: Int,
        duration: String,
        topElevation: Int,
        bottomElevation: Int,
        segments: [SlopeSegment],
        elevationPoints: [ElevationPoint],
        route: [CLLocationCoordinate2D]
    ) {
        self.id = id
        self.date = date
        self.resort = resort
        self.course = course
        self.distanceKm = distanceKm
        self.elevationDrop = elevationDrop
        self.maxSlope = maxSlope
        self.sustainedSteep = sustainedSteep
        self.gentleRatio = gentleRatio
        self.duration = duration
        self.topElevation = topElevation
        self.bottomElevation = bottomElevation
        self.segments = segments
        self.elevationPoints = elevationPoints
        self.route = route
    }
}

enum MockData {
    static let sessions: [MockSession] = {
        let today = Date()
        let calendar = Calendar.current

        return [
            makeSession(
                date: calendar.date(byAdding: .day, value: -1, to: today) ?? today,
                resort: "白馬八方尾根",
                course: "リーゼンスラローム",
                distanceKm: 3.84,
                elevationDrop: 812,
                maxSlope: 27.4,
                sustainedSteep: 184,
                gentleRatio: 18,
                duration: "08:42",
                topElevation: 1_831,
                bottomElevation: 1_019,
                seed: 1
            ),
            makeSession(
                date: calendar.date(byAdding: .day, value: -3, to: today) ?? today,
                resort: "野沢温泉",
                course: "やまびこゲレンデ",
                distanceKm: 4.62,
                elevationDrop: 634,
                maxSlope: 22.1,
                sustainedSteep: 92,
                gentleRatio: 31,
                duration: "11:16",
                topElevation: 1_540,
                bottomElevation: 906,
                seed: 2
            ),
            makeSession(
                date: calendar.date(byAdding: .day, value: -8, to: today) ?? today,
                resort: "妙高高原",
                course: "ホテル第1クワッド沿い",
                distanceKm: 2.91,
                elevationDrop: 487,
                maxSlope: 18.8,
                sustainedSteep: 0,
                gentleRatio: 44,
                duration: "07:03",
                topElevation: 1_378,
                bottomElevation: 891,
                seed: 3
            )
        ]
    }()

    private static func makeSession(
        date: Date,
        resort: String,
        course: String,
        distanceKm: Double,
        elevationDrop: Int,
        maxSlope: Double,
        sustainedSteep: Double,
        gentleRatio: Int,
        duration: String,
        topElevation: Int,
        bottomElevation: Int,
        seed: Int
    ) -> MockSession {
        let bands: [SlopeBand] = [.gentle, .rolling, .steep, .verySteep, .extreme, .steep, .rolling]
        let degrees: [Double] = [8.2, 14.6, 18.8, maxSlope - 2.8, maxSlope, 17.1, 11.4]
        let fractions: [CGFloat] = [0.11, 0.17, 0.19, 0.13, 0.08, 0.19, 0.13]
        let segments = zip(zip(fractions, bands), degrees).map { pair, degree in
            SlopeSegment(fraction: pair.0, band: pair.1, degrees: degree)
        }

        let points: [ElevationPoint] = [
            .init(distance: 0, elevation: Double(topElevation)),
            .init(distance: distanceKm * 0.11, elevation: Double(topElevation - 44)),
            .init(distance: distanceKm * 0.24, elevation: Double(topElevation - 136)),
            .init(distance: distanceKm * 0.36, elevation: Double(topElevation - 294)),
            .init(distance: distanceKm * 0.49, elevation: Double(topElevation - 345)),
            .init(distance: distanceKm * 0.61, elevation: Double(topElevation - 512)),
            .init(distance: distanceKm * 0.75, elevation: Double(topElevation - 601)),
            .init(distance: distanceKm * 0.87, elevation: Double(topElevation - 692)),
            .init(distance: distanceKm, elevation: Double(bottomElevation))
        ]

        return MockSession(
            date: date,
            resort: resort,
            course: course,
            distanceKm: distanceKm,
            elevationDrop: elevationDrop,
            maxSlope: maxSlope,
            sustainedSteep: sustainedSteep,
            gentleRatio: gentleRatio,
            duration: duration,
            topElevation: topElevation,
            bottomElevation: bottomElevation,
            segments: segments,
            elevationPoints: points,
            route: route(seed: seed)
        )
    }

    private static func route(seed: Int) -> [CLLocationCoordinate2D] {
        let baseLatitude = 36.70 + Double(seed) * 0.025
        let baseLongitude = 137.82 + Double(seed) * 0.018

        return (0..<15).map { index in
            CLLocationCoordinate2D(
                latitude: baseLatitude + Double(index) * 0.0012 + sin(Double(index)) * 0.0008,
                longitude: baseLongitude + Double(index) * 0.0010 + cos(Double(index) * 0.8) * 0.0007
            )
        }
    }
}
