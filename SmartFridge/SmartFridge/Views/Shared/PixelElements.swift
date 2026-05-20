// Views/Shared/PixelElements.swift
import SwiftUI
import UIKit

// MARK: - Pixel Divider

struct PixelDivider: View {
    var opacity: Double = 0.25

    var body: some View {
        Rectangle()
            .fill(Color(hex: "#E8A04A").opacity(opacity))
            .frame(height: 2)
    }
}

// MARK: - Eyebrow Label

struct EyebrowLabel: View {
    let text: String
    var color: Color = Color(hex: "#E8A04A")

    var body: some View {
        Text(text.uppercased())
            .font(.pixelify(11, weight: .bold))
            .foregroundStyle(color)
            .tracking(2)
    }
}

// MARK: - Decorative pixel dot row

struct PixelDotRow: View {
    var count: Int = 7
    var colors: [Color] = [
        Color(hex: "#E8A04A"),
        Color(hex: "#F5C842"),
        Color(hex: "#E8A04A"),
        Color(hex: "#F5C842"),
        Color(hex: "#E8A04A"),
    ]
    var size: CGFloat = 8
    var spacing: CGFloat = 6

    var body: some View {
        HStack(spacing: spacing) {
            ForEach(0..<count, id: \.self) { i in
                Rectangle()
                    .fill(colors[i % colors.count])
                    .frame(width: size, height: size)
                    .opacity(i % 3 == 1 ? 1.0 : 0.5)
            }
        }
    }
}

// MARK: - Pixel Checkmark sprite (7 × 6)
// 0=clear  1=body  2=highlight

struct PixelCheckmark: View {
    var pixelSize: CGFloat = 12
    var primaryColor: Color = Color(hex: "#E8A04A")
    var accentColor: Color = Color(hex: "#F5C842")

    private let grid: [[Int]] = [
        [0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 1, 2, 1],
        [0, 0, 0, 1, 2, 1, 0],
        [1, 0, 1, 2, 1, 0, 0],
        [1, 1, 2, 1, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0],
    ]

    var body: some View {
        VStack(spacing: 0) {
            ForEach(0..<grid.count, id: \.self) { row in
                HStack(spacing: 0) {
                    ForEach(0..<grid[row].count, id: \.self) { col in
                        let v = grid[row][col]
                        Rectangle()
                            .fill(v == 1 ? primaryColor : v == 2 ? accentColor : Color.clear)
                            .frame(width: pixelSize, height: pixelSize)
                    }
                }
            }
        }
    }
}

// MARK: - Dismiss keyboard on tap

extension View {
    func dismissKeyboardOnTap() -> some View {
        contentShape(Rectangle())
            .onTapGesture {
                UIApplication.shared.sendAction(
                    #selector(UIResponder.resignFirstResponder),
                    to: nil, from: nil, for: nil
                )
            }
    }
}
