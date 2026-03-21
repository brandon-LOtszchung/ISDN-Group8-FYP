// Views/Shared/CardView.swift
import SwiftUI

struct CardView<Content: View>: View {
    @Environment(ThemeManager.self) private var theme
    @ViewBuilder let content: Content

    var body: some View {
        content
            .background(theme.colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
    }
}
