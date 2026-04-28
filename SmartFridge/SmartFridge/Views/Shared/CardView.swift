// Views/Shared/CardView.swift
import SwiftUI

struct CardView<Content: View>: View {
    var cornerRadius: CGFloat = 8
    var shadowOffset: CGFloat = 4
    @ViewBuilder let content: Content

    var body: some View {
        content
            .neuCard(cornerRadius: cornerRadius, shadowOffset: shadowOffset)
    }
}
