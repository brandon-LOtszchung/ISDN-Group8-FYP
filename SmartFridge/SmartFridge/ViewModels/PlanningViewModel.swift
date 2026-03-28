// ViewModels/PlanningViewModel.swift
import Foundation

extension RecipeRecommendation {
    var matchPercentage: Int {
        guard totalCount > 0 else { return 0 }
        return Int((Double(matchedCount) / Double(totalCount)) * 100)
    }
}

@Observable
@MainActor
final class PlanningViewModel {
    var selectedMemberIds: Set<UUID> = []
    var selectedCuisine: String?
    var recommendations: [RecipeRecommendation] = []
    var selectedDetail: RecipeDetail?
    var isLoadingRecommendations = false
    var isLoadingDetail = false
    var hasFetched = false
    var error: String?

    private let api = RecipeAPIService.shared

    func toggleMember(_ id: UUID) {
        if selectedMemberIds.contains(id) {
            selectedMemberIds.remove(id)
        } else {
            selectedMemberIds.insert(id)
        }
    }

    func fetchRecommendations() async {
        guard let cuisine = selectedCuisine, !selectedMemberIds.isEmpty else { return }
        isLoadingRecommendations = true
        defer { isLoadingRecommendations = false }
        do {
            recommendations = try await api.recommend(
                memberIds: Array(selectedMemberIds),
                cuisineStyle: cuisine
            )
        } catch {
            self.error = error.localizedDescription
        }
        hasFetched = true
    }

    func fetchDetail(for recommendation: RecipeRecommendation) async {
        isLoadingDetail = true
        defer { isLoadingDetail = false }
        do {
            selectedDetail = try await api.fetchRecipe(id: recommendation.savedRecipeId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func addMissingToShoppingList(recipeId: String) async {
        do {
            try await api.addToShoppingList(recipeId: recipeId)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
