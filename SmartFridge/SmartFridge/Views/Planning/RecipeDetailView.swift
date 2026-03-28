// Views/Planning/RecipeDetailView.swift
import SwiftUI

struct RecipeDetailView: View {
    let recommendation: RecipeRecommendation
    @Bindable var planningVM: PlanningViewModel
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(\.dismiss) private var dismiss

    @ScaledMetric private var heroEmojiSize: CGFloat = 60
    @State private var selectedTab = 0
    @State private var showSuccess = false

    var body: some View {
        ScrollViewReader { proxy in
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Hero
                Rectangle()
                    .fill(theme.colors.surfaceAlt)
                    .frame(height: 160)
                    .overlay(Text("🍽️").font(.system(size: heroEmojiSize)).accessibilityHidden(true))
                    .id("top")

                VStack(alignment: .leading, spacing: 12) {
                    Text(recommendation.name).font(.title2.bold())

                    // Info pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            infoPill(recommendation.cuisineStyle, icon: "fork.knife")
                            infoPill("\(recommendation.matchPercentage)% match", icon: "checkmark.circle")
                            infoPill("\(recommendation.missingCount) missing", icon: "cart.badge.plus")
                        }
                    }

                    // Tab picker: Ingredients / Steps
                    Picker("", selection: $selectedTab) {
                        Text(String(localized: "recipe.ingredients")).tag(0)
                        Text(String(localized: "recipe.steps")).tag(1)
                    }
                    .pickerStyle(.segmented)

                    if planningVM.isLoadingDetail {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 30)
                    } else if let detail = planningVM.selectedDetail {
                        if selectedTab == 0 {
                            ingredientsList(detail)
                        } else {
                            stepsList(detail)
                        }
                    }

                    // Add missing to shopping list CTA
                    Button {
                        Task {
                            let errorBefore = planningVM.error
                            await planningVM.addMissingToShoppingList(recipeId: recommendation.savedRecipeId)
                            if planningVM.error == errorBefore {
                                showSuccess = true
                                try? await Task.sleep(for: .seconds(1))
                                dismiss()
                            }
                        }
                    } label: {
                        Text(String(localized: "recipe.add_to_shopping"))
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.colors.primary)
                    .controlSize(.large)
                    .overlay(alignment: .center) {
                        if showSuccess {
                            Label(String(localized: "recipe.added_to_shopping"), systemImage: "checkmark.circle.fill")
                                .font(.subheadline.bold())
                                .padding(12)
                                .background(.regularMaterial)
                                .clipShape(Capsule())
                                .transition(.scale.combined(with: .opacity))
                        }
                    }
                    .animation(.easeInOut(duration: 0.2), value: showSuccess)
                }
                .padding()
            }
        }
        .onChange(of: selectedTab) {
            withAnimation { proxy.scrollTo("top", anchor: .top) }
        }
        } // ScrollViewReader
        .navigationTitle(recommendation.name)
        .navigationBarTitleDisplayMode(.inline)
        .alert(String(localized: "common.error"), isPresented: Binding(
            get: { planningVM.error != nil },
            set: { if !$0 { planningVM.error = nil } }
        )) {
            Button(String(localized: "common.done")) { planningVM.error = nil }
        } message: { Text(planningVM.error ?? "") }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: "Check out this recipe: \(recommendation.name)") {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .task { await planningVM.fetchDetail(for: recommendation) }
    }

    private func infoPill(_ text: String, icon: String) -> some View {
        Label(text, systemImage: icon)
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(theme.colors.surfaceAlt)
            .clipShape(Capsule())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(text)
    }

    @ViewBuilder
    private func ingredientsList(_ detail: RecipeDetail) -> some View {
        VStack(spacing: 0) {
            ForEach(detail.ingredients, id: \.name) { ing in
                // An ingredient is "in fridge" when it appears in the local inventory
                let inFridge = appVM.inventory.contains {
                    $0.name.localizedCaseInsensitiveCompare(ing.name) == .orderedSame
                }
                HStack {
                    Image(systemName: inFridge ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(inFridge ? theme.colors.success : theme.colors.border)
                    Text(ing.name).foregroundStyle(theme.colors.text)
                    Spacer()
                    Text("\(ing.quantity, specifier: "%.1f") \(ing.unit)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !inFridge {
                        Text(String(localized: "recipe.need_to_buy"))
                            .font(.caption.bold())
                            .foregroundStyle(theme.colors.danger)
                    } else {
                        Text(String(localized: "recipe.in_fridge"))
                            .font(.caption.bold())
                            .foregroundStyle(theme.colors.success)
                    }
                }
                .padding(.vertical, 8)
                Divider()
            }
        }
    }

    @ViewBuilder
    private func stepsList(_ detail: RecipeDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(detail.steps.enumerated()), id: \.offset) { i, step in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(i + 1)")
                        .font(.caption.bold())
                        .frame(width: 24, height: 24)
                        .background(theme.colors.primary)
                        .foregroundStyle(.white)
                        .clipShape(Circle())
                    Text(step).font(.body).foregroundStyle(theme.colors.text)
                }
            }
        }
    }
}
