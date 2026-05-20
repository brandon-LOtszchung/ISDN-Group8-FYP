// Views/Shared/LoadingPhaseView.swift
import SwiftUI
import UIKit

struct LoadingPhaseConfig {
    let emoji: String
    let title: String
    let phases: [String]
    let tips: [String]
    let duration: TimeInterval

    static var inventoryInit: LoadingPhaseConfig {
        .init(
            emoji: "🧊",
            title: String(localized: "loading.inventory.title"),
            phases: [
                String(localized: "loading.phase.connecting"),
                String(localized: "loading.phase.fetching"),
                String(localized: "loading.phase.organizing")
            ],
            tips: [
                String(localized: "loading.inventory.tip.1"),
                String(localized: "loading.inventory.tip.2"),
                String(localized: "loading.inventory.tip.3")
            ],
            duration: 15
        )
    }

    static var recipes: LoadingPhaseConfig {
        .init(
            emoji: "💡",
            title: String(localized: "loading.recipes.title"),
            phases: [
                String(localized: "loading.phase.scanning"),
                String(localized: "loading.phase.matching"),
                String(localized: "loading.phase.scoring")
            ],
            tips: [
                String(localized: "loading.recipes.tip.1"),
                String(localized: "loading.recipes.tip.2"),
                String(localized: "loading.recipes.tip.3")
            ],
            duration: 10
        )
    }

    static var cameraScan: LoadingPhaseConfig {
        .init(
            emoji: "📸",
            title: String(localized: "loading.camera.title"),
            phases: [
                String(localized: "loading.phase.uploading"),
                String(localized: "loading.phase.analyzing"),
                String(localized: "loading.phase.adding")
            ],
            tips: [
                String(localized: "loading.camera.tip.1"),
                String(localized: "loading.camera.tip.2"),
                String(localized: "loading.camera.tip.3")
            ],
            duration: 15
        )
    }

    static var recipeDetail: LoadingPhaseConfig {
        .init(
            emoji: "🧑‍🍳",
            title: String(localized: "loading.detail.title"),
            phases: [
                String(localized: "loading.phase.ingredients"),
                String(localized: "loading.phase.fridge_check"),
                String(localized: "loading.phase.building")
            ],
            tips: [
                String(localized: "loading.detail.tip.1"),
                String(localized: "loading.detail.tip.2"),
                String(localized: "loading.detail.tip.3")
            ],
            duration: 10
        )
    }

    static var shopping: LoadingPhaseConfig {
        .init(
            emoji: "🛒",
            title: String(localized: "loading.shopping.title"),
            phases: [
                String(localized: "loading.phase.syncing"),
                String(localized: "loading.phase.sorting"),
                String(localized: "loading.phase.calculating")
            ],
            tips: [
                String(localized: "loading.shopping.tip.1"),
                String(localized: "loading.shopping.tip.2"),
                String(localized: "loading.shopping.tip.3")
            ],
            duration: 8
        )
    }
}

struct LoadingPhaseView: View {
    let config: LoadingPhaseConfig
    @Environment(ThemeManager.self) private var theme

    @State private var progress: Double = 0
    @State private var phaseIndex: Int = 0
    @State private var tipIndex: Int = 0
    @State private var tipOpacity: Double = 0
    @State private var emojiScale: CGFloat = 1.0
    @State private var titleOpacity: Double = 0
    @State private var contentOpacity: Double = 0

    var body: some View {
        VStack(spacing: 24) {
            Text(config.emoji)
                .font(.system(size: 52))
                .scaleEffect(emojiScale)
                .accessibilityHidden(true)

            Text(config.title)
                .font(.spaceGrotesk(.bold, size: 20))
                .foregroundStyle(theme.colors.text)
                .multilineTextAlignment(.center)
                .opacity(titleOpacity)

            VStack(spacing: 10) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(theme.colors.backgroundSubtle)
                        Rectangle()
                            .fill(theme.colors.tealAccent)
                            .frame(width: max(10, geo.size.width * progress))
                            .padding(2)
                    }
                    .overlay(
                        Rectangle()
                            .stroke(theme.colors.border, lineWidth: 2)
                    )
                    .shadow(color: theme.colors.shadow, radius: 0, x: 3, y: 3)
                }
                .frame(height: 22)

                HStack(spacing: 0) {
                    ForEach(Array(config.phases.enumerated()), id: \.offset) { i, phase in
                        HStack(spacing: 4) {
                            ZStack {
                                Rectangle()
                                    .fill(i <= phaseIndex ? theme.colors.tealAccent : Color(UIColor.systemBackground))
                                Rectangle()
                                    .stroke(theme.colors.border, lineWidth: 1.5)
                            }
                            .frame(width: 10, height: 10)
                            .animation(.spring(duration: 0.3), value: phaseIndex)

                            Text(phase)
                                .font(.dotGothic(9))
                                .foregroundStyle(i <= phaseIndex ? theme.colors.text : theme.colors.textMuted)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                                .animation(.easeInOut(duration: AppConstants.Animation.phaseFade), value: phaseIndex)
                        }

                        if i < config.phases.count - 1 {
                            Rectangle()
                                .fill(theme.colors.border.opacity(0.25))
                                .frame(height: 1)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
            .opacity(contentOpacity)

            Text(config.tips[tipIndex])
                .font(.sgBody())
                .foregroundStyle(theme.colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .opacity(tipOpacity)
                .frame(minHeight: 48)
                .transition(.opacity)
        }
        .padding(24)
        .neuCard(shadowOffset: 4)
        .padding(.horizontal, 28)
        .onAppear {
            resetState()
            withAnimation(.easeInOut(duration: AppConstants.Animation.slow).delay(0.1)) {
                titleOpacity = 1
            }
            withAnimation(.easeInOut(duration: AppConstants.Animation.slow).delay(0.2)) {
                contentOpacity = 1
            }
            withAnimation(.easeIn(duration: AppConstants.Animation.phaseFade).delay(0.35)) {
                tipOpacity = 1
            }
        }
        .task { await runProgressAnimation() }
        .task { await runPhaseAdvancement() }
        .task { await runEmojiBounce() }
        .task { await runTipRotation() }
    }

    private func resetState() {
        progress = 0
        phaseIndex = 0
        tipIndex = 0
        tipOpacity = 0
        titleOpacity = 0
        contentOpacity = 0
        emojiScale = 1.0
    }

    private func runProgressAnimation() async {
        withAnimation(.linear(duration: config.duration)) {
            progress = 1.0
        }
    }

    private func runPhaseAdvancement() async {
        guard config.phases.count > 1 else { return }
        let phaseDuration = config.duration / Double(config.phases.count)
        for i in 1..<config.phases.count {
            try? await Task.sleep(for: .seconds(phaseDuration))
            guard !Task.isCancelled else { return }
            withAnimation(.spring(duration: 0.35)) {
                phaseIndex = i
            }
        }
    }

    private func runEmojiBounce() async {
        while !Task.isCancelled {
            withAnimation(.spring(duration: 0.45, bounce: 0.55)) { emojiScale = 1.18 }
            try? await Task.sleep(for: .milliseconds(500))
            withAnimation(.spring(duration: 0.45)) { emojiScale = 1.0 }
            try? await Task.sleep(for: .milliseconds(1800))
        }
    }

    private func runTipRotation() async {
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(3.5))
            guard !Task.isCancelled else { return }
            withAnimation(.easeOut(duration: AppConstants.Animation.phaseFade)) { tipOpacity = 0 }
            try? await Task.sleep(for: .milliseconds(350))
            guard !Task.isCancelled else { return }
            tipIndex = (tipIndex + 1) % config.tips.count
            withAnimation(.easeIn(duration: AppConstants.Animation.phaseFade)) { tipOpacity = 1 }
        }
    }
}
