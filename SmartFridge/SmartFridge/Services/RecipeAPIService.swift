// Services/RecipeAPIService.swift
import Foundation

final class RecipeAPIService {
    static let shared = RecipeAPIService()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()

    // POST /api/recipes/recommend
    func recommend(memberIds: [UUID], cuisineStyle: String) async throws -> [RecipeRecommendation] {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/recommend")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "member_ids": memberIds.map(\.uuidString),
            "cuisine_style": cuisineStyle
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, _) = try await URLSession.shared.data(for: request)
        return try decoder.decode([RecipeRecommendation].self, from: data)
    }

    // GET /api/recipes/{id}
    func fetchRecipe(id: String) async throws -> RecipeDetail {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try decoder.decode(RecipeDetail.self, from: data)
    }

    // POST /api/recipes/{id}/add-to-shopping-list  (no request body)
    func addToShoppingList(recipeId: String) async throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/\(recipeId)/add-to-shopping-list")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}
