// Views/Inventory/ScanPromptView.swift
import SwiftUI

struct ScanPromptView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Binding var showCamera: Bool
    @Binding var isPresented: Bool

    @ScaledMetric private var emojiSize: CGFloat = 60

    var body: some View {
        VStack {
            Spacer()
        VStack(spacing: 20) {
            Text("📷").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "inventory.scan_prompt.title"))
                .font(.spaceGrotesk(.bold, size: 22))
                .foregroundStyle(theme.colors.text)
            Text(String(localized: "inventory.scan_prompt.subtitle"))
                .font(.sgBody())
                .foregroundStyle(theme.colors.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                isPresented = false
                showCamera = true
            } label: {
                Text(String(localized: "inventory.scan_prompt.scan"))
                    .font(.spaceGrotesk(.semibold, size: 16))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(theme.colors.scan)
            .controlSize(.large)

            Button {
                appVM.fridgeInitialized = true
                isPresented = false
            } label: {
                Text(String(localized: "inventory.scan_prompt.empty"))
                    .font(.sgBody())
                    .foregroundStyle(theme.colors.primary)
            }
        }
        .padding(24)
            Spacer()
        }
        .frame(maxHeight: .infinity)
    }
}
