// Views/Planning/FoodIdeaView.swift
import SwiftUI

struct FoodIdeaView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(PlanningViewModel.self) private var planningVM

    private var fetchDisabled: Bool {
        planningVM.selectedCuisine == nil || planningVM.selectedMemberIds.isEmpty || appVM.familyId == nil
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Member selector
                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "planning.cooking_for"))
                        .font(.spaceGrotesk(.semibold, size: 12))
                        .textCase(.uppercase)
                        .tracking(0.5)
                        .foregroundStyle(theme.colors.textMuted)
                        .padding(.horizontal)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(appVM.members) { member in
                                PillView(
                                    label: member.name,
                                    isSelected: planningVM.selectedMemberIds.contains(member.id)
                                ) {
                                    planningVM.toggleMember(member.id)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                // Cuisine selector
                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "planning.cuisine"))
                        .font(.spaceGrotesk(.semibold, size: 12))
                        .textCase(.uppercase)
                        .tracking(0.5)
                        .foregroundStyle(theme.colors.textMuted)
                        .padding(.horizontal)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(Constants.cuisineOptions) { cuisine in
                                PillView(
                                    label: cuisine.label,
                                    isSelected: planningVM.selectedCuisine == cuisine.value
                                ) {
                                    planningVM.selectedCuisine = cuisine.value
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                // Get Ideas button
                Button {
                    guard let fid = appVM.familyId else { return }
                    Task { await planningVM.fetchRecommendations(familyId: fid) }
                } label: {
                    Text(String(localized: "planning.get_ideas"))
                        .font(.spaceGrotesk(.semibold, size: 16))
                        .foregroundStyle(theme.colors.text)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(fetchDisabled ? theme.colors.primary.opacity(0.4) : theme.colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .disabled(fetchDisabled)
                .padding(.horizontal)

                // Recipe list
                if planningVM.isLoadingRecommendations {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                        .transition(.opacity)
                } else if planningVM.recommendations.isEmpty && planningVM.hasFetched {
                    ContentUnavailableView(
                        String(localized: "planning.no_results.title"),
                        systemImage: "fork.knife",
                        description: Text(String(localized: "planning.no_results.description"))
                    )
                    .padding(.top, 40)
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
                } else {
                    ForEach(Array(planningVM.recommendations.enumerated()), id: \.element.id) { index, rec in
                        NavigationLink {
                            RecipeDetailView(recommendation: rec)
                        } label: {
                            RecipeCardView(recommendation: rec)
                                .padding(.horizontal)
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .animation(.spring(duration: 0.4).delay(Double(index) * 0.06), value: planningVM.recommendations.count)
                    }
                }

            }
            .padding(.top)
            .animation(.spring(duration: 0.35), value: planningVM.isLoadingRecommendations)
        }
        .background {
            NeuBackground(screen: .planning)
                .environment(theme)
        }
        .navigationTitle(String(localized: "planning.title"))
        .topBarToolbar()
        .alert(String(localized: "common.error"), isPresented: Binding(
            get: { planningVM.error != nil },
            set: { if !$0 { planningVM.error = nil } }
        )) {
            Button(String(localized: "common.done")) { planningVM.error = nil }
        } message: { Text(planningVM.error ?? "") }
    }
}

// MARK: - Recipe Card

private struct RecipeCardView: View {
    let recommendation: RecipeRecommendation
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: 0) {
                // Hero — per-cuisine gradient with recipe emoji
                RecipeHero.gradient(for: recommendation.cuisineStyle)
                    .frame(height: 120)
                    .overlay(
                        Text(RecipeHero.emoji(for: recommendation.name))
                            .font(.system(size: 56))
                            .shadow(color: .black.opacity(0.18), radius: 6, x: 0, y: 4)
                            .accessibilityHidden(true)
                    )

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(recommendation.name).font(.spaceGrotesk(.semibold, size: 16)).foregroundStyle(theme.colors.text)
                        Spacer()
                    }
                    Text(recommendation.cuisineStyle).font(.sgCaption()).foregroundStyle(theme.colors.textMuted)
                    // Match bar
                    HStack(spacing: 6) {
                        ProgressView(value: Double(recommendation.matchPercentage), total: 100)
                            .tint(theme.colors.success)
                            .scaleEffect(x: 1, y: 0.6, anchor: .center)
                        Text("\(recommendation.matchPercentage)%")
                            .font(.spaceGrotesk(.semibold, size: 12))
                            .foregroundStyle(theme.colors.success)
                    }
                    Text(String(format: String(localized: "planning.missing"), recommendation.missingCount))
                        .font(.sgCaption())
                        .foregroundStyle(recommendation.missingCount == 0 ? theme.colors.success : theme.colors.danger)
                    if let kcal = recommendation.calories ?? RecipeCalories.estimate(for: recommendation.name) {
                        Label("~\(kcal) kcal", systemImage: "flame")
                            .font(.sgCaption())
                            .foregroundStyle(.orange)
                    }
                }
                .padding(10)
            }
        }
    }
}
