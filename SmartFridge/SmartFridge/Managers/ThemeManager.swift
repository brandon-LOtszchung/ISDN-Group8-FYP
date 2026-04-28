// Managers/ThemeManager.swift
import SwiftUI

enum ThemeType: String, CaseIterable {
    case warm, cool
}

struct ThemeColors {
    let primary: Color
    let text: Color
    let textMuted: Color
    let background: Color
    let border: Color
    let success: Color
    let danger: Color
    let scan: Color
    let surface: Color
    let surfaceAlt: Color
    let backgroundSubtle: Color
    let shadow: Color
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
                primary:          Color(hex: "#FFD60A"),
                text:             Color(hex: "#1A1A1A"),
                textMuted:        Color(hex: "#666666"),
                background:       Color(hex: "#FEFAE0"),
                border:           Color(hex: "#1A1A1A"),
                success:          Color(hex: "#00C49A"),
                danger:           Color(hex: "#FF5C5C"),
                scan:             Color(hex: "#FF9F00"),
                surface:          Color(hex: "#FFFFFF"),
                surfaceAlt:       Color(hex: "#FFF8F0"),
                backgroundSubtle: Color(hex: "#FFF5C8"),
                shadow:           Color(hex: "#1A1A1A")
            )
        case .cool:
            return ThemeColors(
                primary:          Color(hex: "#00E5B5"),
                text:             Color(hex: "#1A1A1A"),
                textMuted:        Color(hex: "#555555"),
                background:       Color(hex: "#F0FEFF"),
                border:           Color(hex: "#1A1A1A"),
                success:          Color(hex: "#00C49A"),
                danger:           Color(hex: "#FF5C5C"),
                scan:             Color(hex: "#FF9F00"),
                surface:          Color(hex: "#FFFFFF"),
                surfaceAlt:       Color(hex: "#E8FFFE"),
                backgroundSubtle: Color(hex: "#CCFBF1"),
                shadow:           Color(hex: "#1A1A1A")
            )
        }
    }
}

// MARK: - Neubrutalism component styles

struct NeuCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 8
    var shadowOffset: CGFloat = 4

    func body(content: Content) -> some View {
        content
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(RoundedRectangle(cornerRadius: cornerRadius).strokeBorder(Color(hex: "#1A1A1A"), lineWidth: 2))
            .shadow(color: Color(hex: "#1A1A1A"), radius: 0, x: shadowOffset, y: shadowOffset)
    }
}

struct NeuButtonStyle: ButtonStyle {
    var backgroundColor: Color
    var foregroundColor: Color = Color(hex: "#1A1A1A")
    var shadowOffset: CGFloat = 4

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.spaceGrotesk(.semibold, size: 16))
            .foregroundColor(foregroundColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(hex: "#1A1A1A"), lineWidth: 2))
            .shadow(
                color: Color(hex: "#1A1A1A"),
                radius: 0,
                x: configuration.isPressed ? 1 : shadowOffset,
                y: configuration.isPressed ? 1 : shadowOffset
            )
            .offset(x: configuration.isPressed ? 3 : 0, y: configuration.isPressed ? 3 : 0)
            .animation(.spring(duration: 0.12), value: configuration.isPressed)
    }
}

struct NeuTextFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundStyle(Color(hex: "#1A1A1A"))
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(Color(hex: "#1A1A1A"), lineWidth: 2))
            .shadow(color: Color(hex: "#1A1A1A"), radius: 0, x: 3, y: 3)
    }
}

extension View {
    func neuCard(cornerRadius: CGFloat = 8, shadowOffset: CGFloat = 4) -> some View {
        modifier(NeuCardModifier(cornerRadius: cornerRadius, shadowOffset: shadowOffset))
    }
    func neuTextField() -> some View {
        modifier(NeuTextFieldModifier())
    }
}

// MARK: - Space Grotesk font

enum SpaceGroteskWeight {
    case light, regular, medium, semibold, bold
    var postScriptName: String {
        switch self {
        case .light:    return "SpaceGrotesk-Light"
        case .regular:  return "SpaceGrotesk-Regular"
        case .medium:   return "SpaceGrotesk-Medium"
        case .semibold: return "SpaceGrotesk-SemiBold"
        case .bold:     return "SpaceGrotesk-Bold"
        }
    }
}

extension Font {
    static func spaceGrotesk(_ weight: SpaceGroteskWeight = .regular, size: CGFloat) -> Font {
        .custom(weight.postScriptName, size: size)
    }
    static func sgDisplay() -> Font { .spaceGrotesk(.bold, size: 32) }
    static func sgTitle()   -> Font { .spaceGrotesk(.bold, size: 24) }
    static func sgHeadline() -> Font { .spaceGrotesk(.semibold, size: 18) }
    static func sgBody()     -> Font { .spaceGrotesk(.regular, size: 16) }
    static func sgCaption()  -> Font { .spaceGrotesk(.light, size: 13) }
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
