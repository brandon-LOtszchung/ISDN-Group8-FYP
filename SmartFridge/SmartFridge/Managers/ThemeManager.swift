// Managers/ThemeManager.swift
import SwiftUI

enum ThemeType: String, CaseIterable {
    case warm, cool
}

struct ThemeColors {
    let primary: Color
    let text: Color
    let background: Color
    let border: Color
    let success: Color
    let danger: Color
    let scan: Color
    let surface: Color
    let surfaceAlt: Color
    let backgroundSubtle: Color
}

@Observable
final class ThemeManager {
    private(set) var theme: ThemeType
    private(set) var colors: ThemeColors

    init() {
        let saved = UserDefaults.standard.string(forKey: "app-theme")
        let t = ThemeType(rawValue: saved ?? "") ?? .warm
        self.theme = t
        self.colors = ThemeManager.colors(for: t)
    }

    func setTheme(_ newTheme: ThemeType) {
        theme = newTheme
        colors = ThemeManager.colors(for: newTheme)
        UserDefaults.standard.set(newTheme.rawValue, forKey: "app-theme")
    }

    private static func colors(for theme: ThemeType) -> ThemeColors {
        switch theme {
        case .warm:
            return ThemeColors(
                primary:          Color(hex: "#FF6B35"),
                text:             Color(hex: "#2C3E50"),
                background:       Color(hex: "#FFFFFF"),
                border:           Color(hex: "#E0E0E0"),
                success:          Color(hex: "#27AE60"),
                danger:           Color(hex: "#C0392B"),
                scan:             Color(hex: "#F39C12"),
                surface:          Color(hex: "#FFF8F5"),
                surfaceAlt:       Color(hex: "#FFF0E8"),
                backgroundSubtle: Color(hex: "#FFF3EC")
            )
        case .cool:
            return ThemeColors(
                primary:          Color(hex: "#16A085"),
                text:             Color(hex: "#34495E"),
                background:       Color(hex: "#FFFFFF"),
                border:           Color(hex: "#E0E0E0"),
                success:          Color(hex: "#2ECC71"),
                danger:           Color(hex: "#E74C3C"),
                scan:             Color(hex: "#F39C12"),
                surface:          Color(hex: "#F8F9FA"),
                surfaceAlt:       Color(hex: "#F0F4F8"),
                backgroundSubtle: Color(hex: "#EEF2F7")
            )
        }
    }
}

// MARK: - Color hex initialiser
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
