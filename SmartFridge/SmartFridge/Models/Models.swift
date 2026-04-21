// Models/Models.swift
import Foundation

// MARK: - Language

enum AppLanguage: String, Codable, CaseIterable, Identifiable {
    case en    = "en"
    case zhHK  = "zh-HK"
    case fil   = "fil"
    case id    = "id"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .en:   return "English"
        case .zhHK: return "繁體中文"
        case .fil:  return "Filipino"
        case .id:   return "Bahasa Indonesia"
        }
    }
}

// MARK: - Family

struct FamilyPreferences: Codable {
    var cookingSkillLevel: String
    var budgetRange: String
    var preferredLanguage: AppLanguage
}

struct Family: Codable, Identifiable {
    let id: UUID
    var name: String
    var preferences: FamilyPreferences
    var createdAt: Date
    var updatedAt: Date
}

// MARK: - Family Member

struct MemberPreferences: Codable {
    var spiceLevel: String?
    var favoriteCuisines: [String]
    var dislikedIngredients: [String]
}

struct FamilyMember: Codable, Identifiable {
    let id: UUID
    var familyId: UUID
    var name: String
    var age: Int?
    var dietaryRestrictions: [String]
    var allergies: [String]
    var healthConditions: [String]
    var preferences: MemberPreferences
}

// MARK: - Inventory

struct InventoryItem: Codable, Identifiable {
    let id: UUID
    var name: String
    var category: String
    var quantity: Double
}

// MARK: - Recipes

/// Returned by POST /api/recipes/recommend
struct RecipeRecommendation: Codable, Identifiable {
    var id: String { savedRecipeId }
    var savedRecipeId: String
    var name: String
    var cuisineStyle: String
    var matchedCount: Int
    var totalCount: Int
    var missingCount: Int
    var calories: Int?          // decoded from API when present; nil otherwise
}

/// Returned by GET /api/recipes/{id}
struct RecipeDetail: Codable {
    var savedRecipeId: String
    var name: String
    var cuisineStyle: String
    var matchedCount: Int
    var totalCount: Int
    var ingredients: [RecipeIngredient]
    var steps: [String]
    var missingIngredients: [MissingIngredient]
    var calories: Int?          // decoded from API when present; nil otherwise
}

struct RecipeIngredient: Codable {
    var name: String
    var quantity: Double
    var unit: String
    var required: Bool
}

struct MissingIngredient: Codable {
    var name: String
    var quantity: Double
    var unit: String
    var alternatives: [String]
}

// MARK: - Shopping List

struct ShoppingListItem: Codable, Identifiable {
    let id: UUID
    var familyId: UUID
    var name: String
    var quantity: Double
    var unit: String
    var isPurchased: Bool
    var estimatedUnitCost: Double?
    var alternatives: [String]
    var recipeName: String?

    enum CodingKeys: String, CodingKey {
        case id, name, quantity, unit, alternatives
        case familyId          = "family_id"
        case isPurchased       = "is_purchased"
        case estimatedUnitCost = "estimated_unit_cost"
        case recipeName        = "recipe_name"
    }
}
