// Views/Planning/RecipeDetailView.swift
import SwiftUI

struct RecipeDetailView: View {
    let recommendation: RecipeRecommendation
    @Environment(PlanningViewModel.self) private var planningVM
    @Environment(ShoppingViewModel.self) private var shoppingVM
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(\.dismiss) private var dismiss

    @ScaledMetric private var heroEmojiSize: CGFloat = 60
    @State private var selectedTab = 0
    @State private var showSuccess = false
    @State private var isAddingToShopping = false

    var body: some View {
        ScrollViewReader { proxy in
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Hero — per-cuisine gradient with recipe emoji
                RecipeHero.gradient(for: recommendation.cuisineStyle)
                    .frame(height: 160)
                    .overlay(
                        Text(RecipeHero.emoji(for: recommendation.name))
                            .font(.system(size: heroEmojiSize))
                            .shadow(color: .black.opacity(0.18), radius: 8, x: 0, y: 4)
                            .accessibilityHidden(true)
                    )
                    .id("top")

                VStack(alignment: .leading, spacing: 12) {
                    Text(recommendation.name).font(.spaceGrotesk(.bold, size: 22))

                    // Info pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            infoPill(recommendation.cuisineStyle, icon: "fork.knife")
                            infoPill("\(recommendation.matchPercentage)% match", icon: "checkmark.circle")
                            infoPill("\(recommendation.missingCount) missing", icon: "cart.badge.plus")
                            if let kcal = recommendation.calories ?? RecipeCalories.estimate(for: recommendation.name) {
                                infoPill("~\(kcal) kcal", icon: "flame")
                            }
                        }
                    }

                    // Tab picker: Ingredients / Steps
                    Picker("", selection: $selectedTab) {
                        Text(String(localized: "recipe.ingredients")).tag(0)
                        Text(String(localized: "recipe.steps")).tag(1)
                    }
                    .pickerStyle(.segmented)

                    if planningVM.isLoadingDetail {
                        LoadingPhaseView(config: .recipeDetail)
                            .padding(.top, 16)
                    } else if let detail = planningVM.selectedDetail {
                        if selectedTab == 0 {
                            ingredientsList(detail)
                        } else {
                            stepsList(detail)
                        }
                    }

                    // Add missing to shopping list CTA
                    Button {
                        guard !isAddingToShopping, let fid = appVM.familyId else { return }
                        isAddingToShopping = true
                        Task {
                            defer { isAddingToShopping = false }
                            let errorBefore = planningVM.error
                            await planningVM.addMissingToShoppingList(recipeId: recommendation.savedRecipeId, familyId: fid)
                            if planningVM.error == errorBefore {
                                await shoppingVM.load()
                                showSuccess = true
                                try? await Task.sleep(for: .seconds(1))
                                dismiss()
                            }
                        }
                    } label: {
                        Group {
                            if isAddingToShopping {
                                ProgressView().tint(theme.colors.text)
                            } else {
                                Text(String(localized: "recipe.add_to_shopping"))
                                    .font(.spaceGrotesk(.semibold, size: 16))
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.colors.primary)
                    .controlSize(.large)
                    .disabled(isAddingToShopping)
                    .overlay(alignment: .center) {
                        if showSuccess {
                            Label(String(localized: "recipe.added_to_shopping"), systemImage: "checkmark.circle.fill")
                                .font(.spaceGrotesk(.semibold, size: 15))
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
        .background {
            NeuBackground(screen: .planning)
                .environment(theme)
        }
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
                ShareLink(item: shareText) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .task {
            guard let fid = appVM.familyId else { return }
            await planningVM.fetchDetail(for: recommendation, familyId: fid)
        }
    }

    private var shareText: String {
        var lines: [String] = []
        lines.append("🍽️ \(recommendation.name)")
        lines.append("\(recommendation.cuisineStyle.capitalized) · \(recommendation.matchPercentage)% match")

        if let detail = planningVM.selectedDetail {
            let inventory = appVM.inventory

            lines.append("")
            lines.append("📋 Ingredients:")
            for ing in detail.ingredients {
                let inFridge = inventory.contains {
                    $0.name.localizedCaseInsensitiveCompare(ing.name) == .orderedSame
                }
                let qty = ing.quantity.truncatingRemainder(dividingBy: 1) == 0
                    ? String(format: "%.0f", ing.quantity)
                    : String(format: "%.1f", ing.quantity)
                lines.append("\(inFridge ? "✓" : "○") \(ing.name) – \(qty) \(ing.unit)")
            }

            if !detail.steps.isEmpty {
                lines.append("")
                lines.append("👨‍🍳 Steps:")
                for (i, step) in detail.steps.enumerated() {
                    lines.append("\(i + 1). \(step)")
                }
            }
        }

        lines.append("")
        lines.append("Shared via SmartFridge 🧊")
        return lines.joined(separator: "\n")
    }

    private func infoPill(_ text: String, icon: String) -> some View {
        Label(text, systemImage: icon)
            .font(.spaceGrotesk(.semibold, size: 12))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(theme.colors.surfaceAlt)
            .clipShape(Capsule())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(text)
    }

    @ViewBuilder
    private func ingredientsList(_ detail: RecipeDetail) -> some View {
        let inventory = appVM.inventory
        let sortedIngredients = detail.ingredients.sorted { lhs, rhs in
            func missingPct(_ ing: RecipeIngredient) -> Double {
                guard ing.quantity > 0 else { return 0 }
                let available = inventory
                    .first { $0.name.localizedCaseInsensitiveCompare(ing.name) == .orderedSame }
                    .map(\.quantity) ?? 0
                return max(0, ing.quantity - available) / ing.quantity
            }
            return missingPct(lhs) > missingPct(rhs)
        }
        VStack(spacing: 0) {
            ForEach(sortedIngredients, id: \.name) { ing in
                let inFridge = inventory.contains {
                    $0.name.localizedCaseInsensitiveCompare(ing.name) == .orderedSame
                }
                HStack {
                    Image(systemName: inFridge ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(inFridge ? theme.colors.success : theme.colors.border)
                    Text(ing.name).foregroundStyle(theme.colors.text)
                    Spacer()
                    Text("\(ing.quantity.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", ing.quantity) : String(format: "%.1f", ing.quantity)) \(ing.unit)")
                        .font(.sgCaption())
                        .foregroundStyle(theme.colors.textMuted)
                    if !inFridge {
                        Text(String(localized: "recipe.need_to_buy"))
                            .font(.spaceGrotesk(.semibold, size: 12))
                            .foregroundStyle(theme.colors.danger)
                    } else {
                        Text(String(localized: "recipe.in_fridge"))
                            .font(.spaceGrotesk(.semibold, size: 12))
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
                        .font(.spaceGrotesk(.bold, size: 12))
                        .frame(width: 24, height: 24)
                        .background(theme.colors.primary)
                        .foregroundStyle(theme.colors.text)
                        .clipShape(Circle())
                    Text(step).font(.sgBody()).foregroundStyle(theme.colors.text)
                }
            }
        }
    }
}
