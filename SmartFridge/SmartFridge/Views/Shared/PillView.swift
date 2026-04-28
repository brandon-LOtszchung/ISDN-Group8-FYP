// Views/Shared/PillView.swift
import SwiftUI

struct PillView: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    @Environment(ThemeManager.self) private var theme

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.spaceGrotesk(.semibold, size: 15))
                .padding(.horizontal, 18)
                .padding(.vertical, 10)
                .background(isSelected ? theme.colors.primary : Color.white)
                .foregroundStyle(Color(hex: "#1A1A1A"))
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .strokeBorder(Color(hex: "#1A1A1A"), lineWidth: isSelected ? 2 : 1.5)
                )
                .shadow(
                    color: Color(hex: "#1A1A1A").opacity(isSelected ? 1 : 0),
                    radius: 0, x: 2, y: 2
                )
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.15), value: isSelected)
    }
}
