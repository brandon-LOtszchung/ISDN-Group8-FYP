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
                } else {
                    ForEach(planningVM.recommendations) { rec in
                        NavigationLink {
                            RecipeDetailView(recommendation: rec, planningVM: planningVM)
                        } label: {
                            RecipeCardView(recommendation: rec)
                                .padding(.horizontal)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.top)
        }
        .navigationTitle(String(localized: "planning.title"))
        .topBarToolbar()
        .alert(String(localized: "common.error"), isPresented: .constant(planningVM.error != nil)) {
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
                // Hero placeholder
                Rectangle()
                    .fill(theme.colors.surfaceAlt)
                    .frame(height: 80)
                    .overlay(Text("🍽️").font(.largeTitle).accessibilityHidden(true))

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(recommendation.name).font(.body.bold()).foregroundStyle(theme.colors.text)
                        Spacer()
                        ShareLink(item: "Check out this recipe: \(recommendation.name)") {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundStyle(theme.colors.primary)
                        }
                    }
                    Text(recommendation.cuisineStyle).font(.caption).foregroundStyle(.secondary)
                    // Match bar
                    HStack(spacing: 6) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(theme.colors.border)
                                    .frame(height: 4)
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color.green)
                                    .frame(width: geo.size.width * CGFloat(recommendation.matchPercentage) / 100, height: 4)
                            }
                        }
                        .frame(height: 4)
                        Text("\(recommendation.matchPercentage)%")
                            .font(.caption.bold())
                            .foregroundStyle(.green)
                    }
                    Text("\(recommendation.missingCount) missing")
                        .font(.caption)
                        .foregroundStyle(recommendation.missingCount == 0 ? .green : theme.colors.danger)
                }
                .padding(10)
            }
        }
    }
}
