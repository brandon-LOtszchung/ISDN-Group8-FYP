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
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? theme.colors.primary : Color(.systemBackground))
                .foregroundStyle(isSelected ? .white : theme.colors.text)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isSelected ? theme.colors.primary : theme.colors.border, lineWidth: 1.5)
                )
        }
        .buttonStyle(.plain)
    }
}
