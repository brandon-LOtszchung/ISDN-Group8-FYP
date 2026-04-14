// Views/Onboarding/OnboardingView.swift
import SwiftUI

private enum OnboardingStep: Int, CaseIterable {
    case name, cookingIntro, cooking, cookingFeedback,
         budget, budgetFeedback, members, summary
}

struct OnboardingView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @ScaledMetric private var emojiSize: CGFloat = 52

    @State private var step: OnboardingStep = .name
    @State private var familyName = ""
    @State private var selectedSkill = ""
    @State private var budgetAmount: Int = 50
    @State private var members: [FamilyMember] = []

    // Typewriter state
    @State private var typewriterText = ""
    @State private var typewriterDone = false

    var body: some View {
        VStack(spacing: 0) {
            // Back button row
            HStack {
                if step.rawValue > 0 {
                    Button {
                        if let prev = OnboardingStep(rawValue: step.rawValue - 1) {
                            step = prev
                        }
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.body.bold())
                            .foregroundStyle(theme.colors.primary)
                    }
                    .accessibilityLabel("Back")
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)
            // Progress dots
            progressDots
            // Step content — paged with swipe support
            TabView(selection: Binding(
                get: { step.rawValue },
                set: { newVal in
                    if let s = OnboardingStep(rawValue: newVal) { step = s }
                }
            )) {
                ForEach(OnboardingStep.allCases, id: \.rawValue) { s in
                    ScrollView {
                        stepContentFor(s)
                            .padding(.horizontal, 24)
                            .padding(.top, 20)
                    }
                    .tag(s.rawValue)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: step)
            // Continue button
            continueButton
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
                .disabled(!shouldShowContinue)
        }
        .background(theme.colors.background.ignoresSafeArea())
        .onChange(of: step) { _, newStep in startTypewriter(for: newStep) }
        .onAppear { startTypewriter(for: step) }
    }

    // MARK: - Progress Dots

    private var progressDots: some View {
        HStack(spacing: 6) {
            ForEach(0..<OnboardingStep.allCases.count, id: \.self) { i in
                RoundedRectangle(cornerRadius: 3)
                    .fill(i <= step.rawValue ? theme.colors.primary : theme.colors.border)
                    .frame(width: i == step.rawValue ? 20 : 8, height: 6)
                    .animation(.spring(), value: step)
            }
        }
        .padding(.top, 12)
        .padding(.bottom, 12)
    }

    // MARK: - Step routing

    @ViewBuilder
    private func stepContentFor(_ s: OnboardingStep) -> some View {
        switch s {
        case .name:            nameStep
        case .cookingIntro:    typewriterStep(text: "Let's talk about how your family cooks.", emoji: "🍳")
        case .cooking:         cookingStep
        case .cookingFeedback: typewriterStep(text: feedbackText(for: selectedSkill), emoji: "⭐")
        case .budget:          budgetStep
        case .budgetFeedback:  typewriterStep(text: "Great! We'll find recipes that fit your budget.", emoji: "💰")
        case .members:         membersStep
        case .summary:         summaryStep
        }
    }

    @ViewBuilder
    private var stepContent: some View {
        stepContentFor(step)
    }

    // MARK: - Individual Steps

    private var nameStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("👨‍👩‍👧‍👦").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "onboarding.family_name.title")).font(.title.bold())
            TextField(String(localized: "onboarding.family_name.hint"), text: $familyName)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .font(.body)
        }
    }

    private var cookingStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("🍽️").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "onboarding.cooking.title")).font(.title.bold())
            FlowLayout(spacing: 8) {
                ForEach(Constants.cookingSkillLevels, id: \.self) { skill in
                    PillView(label: skill.capitalized, isSelected: selectedSkill == skill) {
                        selectedSkill = skill
                    }
                }
            }
        }
    }

    private var budgetStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("💵").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "onboarding.budget.title")).font(.title.bold())
            BudgetSliderView(budgetAmount: $budgetAmount)
        }
    }

    private var membersStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("👥").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "onboarding.members.title")).font(.title.bold())
            Text(String(localized: "onboarding.members.dietary_hint"))
                .font(.subheadline)
                .foregroundStyle(.secondary)
            ForEach(members.indices, id: \.self) { i in
                MemberRowView(member: $members[i]) {
                    members.remove(at: i)
                }
            }
            Button(String(localized: "onboarding.add_member")) {
                members.append(FamilyMember(
                    id: UUID(), familyId: Constants.defaultFamilyID,
                    name: "", age: nil, dietaryRestrictions: [], allergies: [],
                    healthConditions: [], preferences: MemberPreferences(
                        spiceLevel: nil, favoriteCuisines: [], dislikedIngredients: []
                    )
                ))
            }
            .foregroundStyle(theme.colors.primary)
        }
    }

    private var summaryStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("🎉").font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(String(localized: "onboarding.summary.title")).font(.title.bold())
            Group {
                LabeledContent(String(localized: "onboarding.summary.family"), value: familyName)
                LabeledContent(String(localized: "onboarding.summary.cooking_skill"), value: selectedSkill.capitalized)
                LabeledContent(String(localized: "onboarding.summary.budget"),
                               value: budgetTier(for: budgetAmount).label)
                LabeledContent(String(localized: "onboarding.summary.members"), value: "\(members.count)")
            }
            .font(.body)
        }
    }

    // MARK: - Typewriter step

    private func typewriterStep(text: String, emoji: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(emoji).font(.system(size: emojiSize)).accessibilityHidden(true)
            Text(typewriterText)
                .font(.title2.bold())
                .animation(nil)
                .accessibilityLabel(text)
        }
    }

    // MARK: - Typewriter logic

    private func startTypewriter(for s: OnboardingStep) {
        typewriterText = ""
        typewriterDone = false
        let targets: [OnboardingStep: String] = [
            .cookingIntro:    "Let's talk about how your family cooks.",
            .cookingFeedback: feedbackText(for: selectedSkill),
            .budgetFeedback:  "Great! We'll find recipes that fit your budget."
        ]
        guard let target = targets[s] else {
            typewriterDone = true
            return
        }
        Task {
            for char in target {
                try? await Task.sleep(for: .milliseconds(30))
                typewriterText.append(char)
            }
            typewriterDone = true
        }
    }

    private func feedbackText(for skill: String) -> String {
        switch skill {
        case "beginner":     return "No worries — we'll keep the recipes simple and easy to follow."
        case "intermediate": return "Nice! You'll have plenty of variety to choose from."
        case "advanced":     return "Impressive! Get ready for some complex and exciting dishes."
        default:             return "Great choice!"
        }
    }

    // MARK: - Continue button

    private var shouldShowContinue: Bool {
        switch step {
        case .name:            return !familyName.trimmingCharacters(in: .whitespaces).isEmpty
        case .cookingIntro:    return typewriterDone
        case .cooking:         return !selectedSkill.isEmpty
        case .cookingFeedback: return typewriterDone
        case .budget:          return true
        case .budgetFeedback:  return typewriterDone
        case .members:         return true
        case .summary:         return true
        }
    }

    private var continueButton: some View {
        Button(step == .summary ? "Get Started" : String(localized: "onboarding.continue")) {
            if step == .summary { finish() }
            else if let next = OnboardingStep(rawValue: step.rawValue + 1) { step = next }
        }
        .font(.body.bold())
        .frame(maxWidth: .infinity)
        .buttonStyle(.borderedProminent)
        .tint(theme.colors.primary)
        .controlSize(.large)
    }

    // MARK: - Finish

    private func finish() {
        let family = Family(
            id: Constants.defaultFamilyID,
            name: familyName,
            preferences: FamilyPreferences(
                cookingSkillLevel: selectedSkill,
                budgetRange: budgetTier(for: budgetAmount).value,
                preferredLanguage: .en
            ),
            createdAt: Date(),
            updatedAt: Date()
        )
        appVM.saveFamily(family, members: members)
        appVM.completeOnboarding()
    }
}

// MARK: - Member Row

private struct MemberRowView: View {
    @Binding var member: FamilyMember
    let onDelete: () -> Void
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        HStack {
            TextField("Name", text: $member.name)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            Button(role: .destructive, action: onDelete) {
                Image(systemName: "minus.circle.fill")
                    .foregroundStyle(theme.colors.danger)
            }
        }
    }
}

