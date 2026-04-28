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

    private func addAuthHeader(to request: inout URLRequest) {
        if let token = SupabaseService.shared.currentAccessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    private func serverError(data: Data, response: URLResponse) -> URLError {
        let status = (response as? HTTPURLResponse)?.statusCode ?? -1
        let body = String(data: data, encoding: .utf8).map { String($0.prefix(300)) } ?? "no body"
        return URLError(.badServerResponse, userInfo: [
            NSLocalizedDescriptionKey: "Server \(status): \(body)"
        ])
    }

    // Wrapper types matching backend JSON envelope
    private struct RecipeListEnvelope: Decodable {
        let recipes: [RecipeRecommendation]
    }
    private struct RecipeDetailEnvelope: Decodable {
        let recipe: RecipeDetail
    }

    // POST /api/recipes/recommend
    func recommend(memberIds: [UUID], cuisineStyle: String, familyId: UUID) async throws -> [RecipeRecommendation] {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/recommend")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(to: &request)
        let body: [String: Any] = [
            "family_id": familyId.uuidString,
            "member_ids": memberIds.map(\.uuidString),
            "cuisine_style": cuisineStyle
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw serverError(data: data, response: response)
        }
        if let wrapped = try? decoder.decode(RecipeListEnvelope.self, from: data) {
            return wrapped.recipes
        }
        return try decoder.decode([RecipeRecommendation].self, from: data)
    }

    // GET /api/recipes/{id}?family_id={familyId}
    func fetchRecipe(id: String, familyId: UUID) async throws -> RecipeDetail {
        var components = URLComponents(string: "\(Config.apiBaseURL)/api/recipes/\(id)")!
        components.queryItems = [URLQueryItem(name: "family_id", value: familyId.uuidString)]
        var request = URLRequest(url: components.url!)
        addAuthHeader(to: &request)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw serverError(data: data, response: response)
        }
        if let wrapped = try? decoder.decode(RecipeDetailEnvelope.self, from: data) {
            return wrapped.recipe
        }
        return try decoder.decode(RecipeDetail.self, from: data)
    }

    // POST /api/recipes/{id}/add-to-shopping-list
    func addToShoppingList(recipeId: String, familyId: UUID) async throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/\(recipeId)/add-to-shopping-list")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(to: &request)
        let body: [String: Any] = ["family_id": familyId.uuidString]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw serverError(data: data, response: response)
        }
    }
}
