// Views/Planning/FoodIdeaView.swift
import SwiftUI

struct FoodIdeaView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @State private var planningVM = PlanningViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Member selector
                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "planning.cooking_for"))
                        .font(.caption.bold().uppercaseSmallCaps())
                        .foregroundStyle(.secondary)
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
                        .font(.caption.bold().uppercaseSmallCaps())
                        .foregroundStyle(.secondary)
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
                    Task { await planningVM.fetchRecommendations() }
                } label: {
                    Text(String(localized: "planning.get_ideas"))
                        .font(.body.bold())
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(theme.colors.primary)
                .controlSize(.large)
                .disabled(planningVM.selectedCuisine == nil || planningVM.selectedMemberIds.isEmpty)
                .padding(.horizontal)

                // Recipe list
                if planningVM.isLoadingRecommendations {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else if planningVM.recommendations.isEmpty && planningVM.hasFetched {
                    ContentUnavailableView(
                        String(localized: "planning.no_results.title"),
                        systemImage: "fork.knife",
                        description: Text(String(localized: "planning.no_results.description"))
                    )
                    .padding(.top, 40)
                } else {
                    ForEach(planningVM.recommendations) { rec in
                        NavigationLink {
                            RecipeDetailView(recommendation: rec, planningVM: planningVM)
                        } label: {
                            RecipeCardView(recommendation: rec)
                                .padding(.horizontal)
                        }
                    }
                }
            }
            .padding(.top)
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
                        Text(recommendation.name).font(.body.bold()).foregroundStyle(theme.colors.text)
                        Spacer()
                    }
                    Text(recommendation.cuisineStyle).font(.caption).foregroundStyle(.secondary)
                    // Match bar
                    HStack(spacing: 6) {
                        ProgressView(value: Double(recommendation.matchPercentage), total: 100)
                            .tint(theme.colors.success)
                            .scaleEffect(x: 1, y: 0.6, anchor: .center)
                        Text("\(recommendation.matchPercentage)%")
                            .font(.caption.bold())
                            .foregroundStyle(theme.colors.success)
                    }
                    Text("\(recommendation.missingCount) missing")
                        .font(.caption)
                        .foregroundStyle(recommendation.missingCount == 0 ? theme.colors.success : theme.colors.danger)
                    if let kcal = recommendation.calories ?? RecipeCalories.estimate(for: recommendation.name) {
                        Label("~\(kcal) kcal", systemImage: "flame")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                }
                .padding(10)
            }
        }
    }
}
