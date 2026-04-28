// Views/Onboarding/OnboardingView.swift
import SwiftUI
import UIKit

private enum OnboardingStep: Int, CaseIterable {
    case welcome, name, cooking, budget, members, summary
}

struct OnboardingView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @ScaledMetric private var emojiSize: CGFloat = 56

    @State private var step: OnboardingStep = .welcome
    @State private var navDirection = 1
    @State private var familyName = ""
    @State private var selectedSkill = ""
    @State private var budgetAmount: Int = 30
    @State private var members: [FamilyMember] = []

    // Entrance animation
    @State private var contentAppeared = false

    // Inline cooking feedback
    @State private var cookingFeedbackText = ""
    @State private var cookingFeedbackVisible = false
    @State private var advanceTask: Task<Void, Never>?

    // Inline budget feedback
    @State private var budgetFeedbackVisible = false

    // Summary stagger
    @State private var summaryRowIndex = -1

    @State private var isFinishing = false
    @State private var finishError: String?

    var body: some View {
        VStack(spacing: 0) {
            // Back button row — hidden on welcome
            HStack {
                if step.rawValue > 0 {
                    Button {
                        advanceTask?.cancel()
                        if let prev = OnboardingStep(rawValue: step.rawValue - 1) {
                            navDirection = -1
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
            .opacity(step == .welcome ? 0 : 1)
            .animation(.easeInOut(duration: 0.2), value: step == .welcome)

            // Progress bar (hidden on welcome)
            if step != .welcome {
                progressBar
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .animation(.easeInOut(duration: 0.25), value: step == .welcome)
            }

            // Step content
            ZStack {
                ScrollView {
                    stepContentFor(step)
                        .padding(.horizontal, 24)
                        .padding(.top, 20)
                        .padding(.bottom, 100)
                }
                .scrollDismissesKeyboard(.interactively)
                .id(step.rawValue)
                .transition(.asymmetric(
                    insertion: .move(edge: navDirection > 0 ? .trailing : .leading).combined(with: .opacity),
                    removal: .move(edge: navDirection > 0 ? .leading : .trailing).combined(with: .opacity)
                ))
            }
            .animation(.spring(duration: 0.38, bounce: 0.08), value: step)
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 0) {
                if let err = finishError {
                    Text(err)
                        .font(.spaceGrotesk(.regular, size: 13))
                        .foregroundStyle(theme.colors.danger)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                        .padding(.top, 8)
                }
                continueButton
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .background(.ultraThinMaterial)
        }
        .background {
            NeuBackground(screen: .onboarding(step: step.rawValue))
                .environment(theme)
                .id(step.rawValue)
                .transition(.opacity)
                .animation(.easeInOut(duration: 0.35), value: step.rawValue)
        }
        .onChange(of: step) { _, newStep in
            resetEntrance()
            cookingFeedbackVisible = false
            cookingFeedbackText = ""
            budgetFeedbackVisible = false
            summaryRowIndex = -1
            if newStep == .summary { startSummaryAnimation() }
            if newStep == .cooking && !selectedSkill.isEmpty {
                cookingFeedbackText = feedbackText(for: selectedSkill)
                withAnimation(.spring(duration: 0.4).delay(0.35)) {
                    cookingFeedbackVisible = true
                }
            }
        }
        .onAppear {
            withAnimation(.spring(duration: 0.55).delay(0.1)) {
                contentAppeared = true
            }
        }
        .sensoryFeedback(.impact(flexibility: .soft), trigger: step)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) { Spacer() }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(String(format: NSLocalizedString("onboarding.step_of", comment: ""), step.rawValue, OnboardingStep.allCases.count - 1))
                .font(.spaceGrotesk(.regular, size: 12))
                .foregroundStyle(theme.colors.textMuted)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(theme.colors.border.opacity(0.2))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(theme.colors.primary)
                        .frame(width: geo.size.width * progress, height: 6)
                        .animation(.spring(duration: 0.45), value: step)
                }
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 24)
        .padding(.top, 8)
        .padding(.bottom, 16)
    }

    private var progress: CGFloat {
        let total = CGFloat(OnboardingStep.allCases.count - 1)
        return max(0, CGFloat(step.rawValue) / total)
    }

    // MARK: - Step routing

    @ViewBuilder
    private func stepContentFor(_ s: OnboardingStep) -> some View {
        switch s {
        case .welcome:  welcomeStep
        case .name:     nameStep
        case .cooking:  cookingStep
        case .budget:   budgetStep
        case .members:  membersStep
        case .summary:  summaryStep
        }
    }

    // MARK: - Entrance helpers

    private func resetEntrance() {
        contentAppeared = false
        withAnimation(.spring(duration: 0.5).delay(0.14)) {
            contentAppeared = true
        }
    }

    // MARK: - Welcome

    private var welcomeStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 24)
            Text("🧊")
                .font(.system(size: 88))
                .accessibilityHidden(true)
                .opacity(contentAppeared ? 1 : 0)
                .scaleEffect(contentAppeared ? 1 : 0.3)
                .animation(.spring(duration: 0.7, bounce: 0.5), value: contentAppeared)
            VStack(spacing: 10) {
                Text("SmartFridge")
                    .font(.spaceGrotesk(.bold, size: 38))
                    .foregroundStyle(theme.colors.text)
                    .opacity(contentAppeared ? 1 : 0)
                    .offset(y: contentAppeared ? 0 : 22)
                    .animation(.spring(duration: 0.5).delay(0.2), value: contentAppeared)
                Text(String(localized: "onboarding.welcome.subtitle"))
                    .font(.spaceGrotesk(.regular, size: 17))
                    .foregroundStyle(theme.colors.textMuted)
                    .multilineTextAlignment(.center)
                    .opacity(contentAppeared ? 1 : 0)
                    .offset(y: contentAppeared ? 0 : 16)
                    .animation(.spring(duration: 0.5).delay(0.35), value: contentAppeared)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Name

    private var nameStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("👨‍👩‍👧‍👦")
                .font(.system(size: emojiSize))
                .accessibilityHidden(true)
                .modifier(Entrance(appeared: contentAppeared, delay: 0))
            Text(String(localized: "onboarding.family_name.title"))
                .font(.spaceGrotesk(.bold, size: 24))
                .foregroundStyle(theme.colors.text)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.08))
            TextField(String(localized: "onboarding.family_name.hint"), text: $familyName)
                .font(.spaceGrotesk(.regular, size: 16))
                .neuTextField()
                .modifier(Entrance(appeared: contentAppeared, delay: 0.16))
                .onSubmit {
                    if !familyName.trimmingCharacters(in: .whitespaces).isEmpty {
                        navDirection = 1
                        step = .cooking
                    }
                }
        }
    }

    // MARK: - Cooking (inline feedback + auto-advance)

    private var cookingStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("🍽️")
                .font(.system(size: emojiSize))
                .accessibilityHidden(true)
                .modifier(Entrance(appeared: contentAppeared, delay: 0))
            Text(String(localized: "onboarding.cooking.title"))
                .font(.spaceGrotesk(.bold, size: 24))
                .foregroundStyle(theme.colors.text)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.08))
            FlowLayout(spacing: 8) {
                ForEach(Constants.cookingSkillLevels, id: \.self) { skill in
                    PillView(label: NSLocalizedString("cooking.skill.\(skill)", comment: ""), isSelected: selectedSkill == skill) {
                        guard selectedSkill != skill else { return }
                        selectedSkill = skill
                        triggerCookingFeedback(for: skill)
                    }
                }
            }
            .modifier(Entrance(appeared: contentAppeared, delay: 0.16))

            if cookingFeedbackVisible {
                inlineFeedbackBubble(text: cookingFeedbackText)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(duration: 0.4), value: cookingFeedbackVisible)
    }

    private func triggerCookingFeedback(for skill: String) {
        advanceTask?.cancel()
        cookingFeedbackText = feedbackText(for: skill)
        withAnimation(.spring(duration: 0.4)) { cookingFeedbackVisible = true }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        advanceTask = Task {
            try? await Task.sleep(for: .milliseconds(1500))
            guard !Task.isCancelled else { return }
            await MainActor.run { navDirection = 1; step = .budget }
        }
    }

    private func feedbackText(for skill: String) -> String {
        switch skill {
        case "beginner":     return String(localized: "onboarding.cooking_feedback.beginner")
        case "intermediate": return String(localized: "onboarding.cooking_feedback.intermediate")
        case "advanced":     return String(localized: "onboarding.cooking_feedback.advanced")
        default:             return String(localized: "onboarding.cooking_feedback.default")
        }
    }

    // MARK: - Budget (inline feedback on first slider interaction)

    private var budgetStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("💵")
                .font(.system(size: emojiSize))
                .accessibilityHidden(true)
                .modifier(Entrance(appeared: contentAppeared, delay: 0))
            Text(String(localized: "onboarding.budget.title"))
                .font(.spaceGrotesk(.bold, size: 24))
                .foregroundStyle(theme.colors.text)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.08))
            BudgetSliderView(budgetAmount: $budgetAmount)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.16))
                .onChange(of: budgetAmount) { _, _ in
                    guard !budgetFeedbackVisible else { return }
                    withAnimation(.spring(duration: 0.4)) { budgetFeedbackVisible = true }
                }
            if budgetFeedbackVisible {
                inlineFeedbackBubble(text: String(localized: "onboarding.budget.feedback"))
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(duration: 0.4), value: budgetFeedbackVisible)
    }

    // MARK: - Members

    // MARK: - Members

    private var membersStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("👥")
                .font(.system(size: emojiSize))
                .accessibilityHidden(true)
                .modifier(Entrance(appeared: contentAppeared, delay: 0))
            Text(String(localized: "onboarding.members.title"))
                .font(.spaceGrotesk(.bold, size: 24))
                .foregroundStyle(theme.colors.text)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.08))
            Text(String(localized: "onboarding.members.dietary_hint"))
                .font(.sgCaption())
                .foregroundStyle(theme.colors.textMuted)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.16))
            memberRows
            addMemberButton
            if members.isEmpty { skipButton }
        }
        .animation(.spring(duration: 0.35), value: members.count)
    }

    @ViewBuilder
    private var memberRows: some View {
        ForEach($members) { $member in
            MemberRowView(member: $member) {
                withAnimation(.spring(duration: 0.3)) {
                    members.removeAll { $0.id == member.id }
                }
            }
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }

    private var addMemberButton: some View {
        Button(String(localized: "onboarding.add_member")) {
            withAnimation(.spring(duration: 0.35)) {
                members.append(FamilyMember(
                    id: UUID(), familyId: UUID(), name: "",
                    age: nil, dietaryRestrictions: [], allergies: [],
                    healthConditions: [], spiceLevel: nil,
                    favoriteCuisines: [], dislikedIngredients: []
                ))
            }
        }
        .font(.spaceGrotesk(.semibold, size: 15))
        .foregroundStyle(theme.colors.primary)
    }

    private var skipButton: some View {
        Button(String(localized: "onboarding.members.skip")) {
            navDirection = 1; step = .summary
        }
        .font(.spaceGrotesk(.regular, size: 14))
        .foregroundStyle(theme.colors.textMuted)
        .frame(maxWidth: .infinity)
        .modifier(Entrance(appeared: contentAppeared, delay: 0.24))
    }

    // MARK: - Summary

    private var summaryStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("🎉")
                .font(.system(size: emojiSize))
                .accessibilityHidden(true)
                .opacity(contentAppeared ? 1 : 0)
                .scaleEffect(contentAppeared ? 1 : 0.4)
                .animation(.spring(duration: 0.6, bounce: 0.5), value: contentAppeared)
            Text(String(localized: "onboarding.summary.title"))
                .font(.spaceGrotesk(.bold, size: 24))
                .foregroundStyle(theme.colors.text)
                .modifier(Entrance(appeared: contentAppeared, delay: 0.08))
            VStack(spacing: 8) {
                stagedRow(String(localized: "onboarding.summary.family"), familyName, 0)
                stagedRow(String(localized: "onboarding.summary.cooking_skill"),
                          NSLocalizedString("cooking.skill.\(selectedSkill)", comment: ""), 1)
                stagedRow(String(localized: "onboarding.summary.budget"),
                          budgetTier(for: budgetAmount).label, 2)
                stagedRow(String(localized: "onboarding.summary.members"), "\(members.count)", 3)
            }
        }
    }

    private func stagedRow(_ label: String, _ value: String, _ index: Int) -> some View {
        SummaryRow(label: label, value: value)
            .opacity(summaryRowIndex >= index ? 1 : 0)
            .offset(y: summaryRowIndex >= index ? 0 : 18)
            .animation(.spring(duration: 0.45).delay(Double(index) * 0.09), value: summaryRowIndex)
    }

    private func startSummaryAnimation() {
        for i in 0..<4 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2 + Double(i) * 0.1) {
                withAnimation { summaryRowIndex = i }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }

    // MARK: - Shared inline feedback bubble

    private func inlineFeedbackBubble(text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "sparkles")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(theme.colors.primary)
            Text(text)
                .font(.spaceGrotesk(.medium, size: 15))
                .foregroundStyle(theme.colors.text)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.primary.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(theme.colors.primary.opacity(0.35), lineWidth: 1.5))
    }

    // MARK: - Continue button

    private var shouldShowContinue: Bool {
        switch step {
        case .welcome:  return true
        case .name:     return !familyName.trimmingCharacters(in: .whitespaces).isEmpty
        case .cooking:  return !selectedSkill.isEmpty
        case .budget:   return true
        case .members:  return true
        case .summary:  return true
        }
    }

    private var continueButton: some View {
        Button {
            advanceTask?.cancel()
            navDirection = 1
            if step == .summary { finish() }
            else if let next = OnboardingStep(rawValue: step.rawValue + 1) { step = next }
        } label: {
            if step == .summary && isFinishing {
                ProgressView()
                    .tint(Color(hex: "#1A1A1A"))
                    .frame(height: 24)
            } else {
                Text(step == .summary
                     ? String(localized: "onboarding.get_started")
                     : String(localized: "onboarding.continue"))
            }
        }
        .buttonStyle(NeuButtonStyle(backgroundColor: theme.colors.primary))
        .disabled(!shouldShowContinue || (step == .summary && isFinishing))
    }

    // MARK: - Finish

    private func finish() {
        let newFamilyId = UUID()
        let userId = SupabaseService.shared.currentUserId
        let updatedMembers = members
            .filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
            .map { m in
                FamilyMember(
                    id: m.id, familyId: newFamilyId, name: m.name,
                    age: m.age, dietaryRestrictions: m.dietaryRestrictions,
                    allergies: m.allergies, healthConditions: m.healthConditions,
                    spiceLevel: m.spiceLevel, favoriteCuisines: m.favoriteCuisines,
                    dislikedIngredients: m.dislikedIngredients
                )
            }
        let family = Family(
            id: newFamilyId, name: familyName,
            cookingSkillLevel: selectedSkill,
            budgetRange: budgetTier(for: budgetAmount).value,
            preferredLanguage: .en,
            createdAt: Date(), updatedAt: Date(), userId: userId
        )
        isFinishing = true
        finishError = nil
        Task {
            do {
                try await appVM.saveFamilyAsync(family, members: updatedMembers)
                appVM.completeOnboarding()
            } catch {
                isFinishing = false
                finishError = error.localizedDescription
            }
        }
    }
}

// MARK: - Entrance modifier

private struct Entrance: ViewModifier {
    let appeared: Bool
    let delay: Double

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 20)
            .animation(.spring(duration: 0.45).delay(delay), value: appeared)
    }
}

// MARK: - Summary Row

private struct SummaryRow: View {
    let label: String
    let value: String
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        HStack {
            Text(label)
                .font(.spaceGrotesk(.medium, size: 14))
                .foregroundStyle(theme.colors.textMuted)
            Spacer()
            Text(value)
                .font(.spaceGrotesk(.semibold, size: 15))
                .foregroundStyle(theme.colors.text)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(hex: "#1A1A1A"), lineWidth: 2))
        .shadow(color: Color(hex: "#1A1A1A"), radius: 0, x: 3, y: 3)
    }
}

// MARK: - Member Row

private struct MemberRowView: View {
    @Binding var member: FamilyMember
    let onDelete: () -> Void
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        HStack {
            TextField(String(localized: "profile.member.name"), text: $member.name)
                .foregroundStyle(theme.colors.text)
                .padding(10)
                .background(theme.colors.surface)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(hex: "#1A1A1A"), lineWidth: 1.5))
            Button(role: .destructive, action: onDelete) {
                Image(systemName: "minus.circle.fill")
                    .foregroundStyle(theme.colors.danger)
            }
        }
    }
}
