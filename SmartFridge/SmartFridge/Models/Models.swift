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

struct Family: Codable, Identifiable {
    let id: UUID
    var name: String
    var cookingSkillLevel: String
    var budgetRange: String
    var preferredLanguage: AppLanguage
    var createdAt: Date?
    var updatedAt: Date?
    var userId: UUID?

    enum CodingKeys: String, CodingKey {
        case id, name
        case cookingSkillLevel = "cooking_skill_level"
        case budgetRange       = "budget_range"
        case preferredLanguage = "preferred_language"
        case createdAt         = "created_at"
        case updatedAt         = "updated_at"
        case userId            = "user_id"
    }
}

// MARK: - Family Member

struct FamilyMember: Codable, Identifiable {
    let id: UUID
    var familyId: UUID
    var name: String
    var age: Int?
    var dietaryRestrictions: [String]
    var allergies: [String]
    var healthConditions: [String]
    var spiceLevel: String?
    var favoriteCuisines: [String]
    var dislikedIngredients: [String]

    enum CodingKeys: String, CodingKey {
        case id, name, age, allergies
        case familyId             = "family_id"
        case dietaryRestrictions  = "dietary_restrictions"
        case healthConditions     = "health_conditions"
        case spiceLevel           = "spice_level"
        case favoriteCuisines     = "favorite_cuisines"
        case dislikedIngredients  = "disliked_ingredients"
    }
}

// MARK: - Inventory

struct InventoryItem: Codable, Identifiable {
    let id: UUID
    var familyId: UUID
    var name: String
    var category: String
    var quantity: Double
    var expiryDate: Date?

    enum CodingKeys: String, CodingKey {
        case id, name, category, quantity
        case familyId   = "family_id"
        case expiryDate = "expiry_date"
    }

    init(id: UUID, familyId: UUID, name: String, category: String, quantity: Double, expiryDate: Date? = nil) {
        self.id = id
        self.familyId = familyId
        self.name = name
        self.category = category
        self.quantity = quantity
        self.expiryDate = expiryDate
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id       = try c.decode(UUID.self,   forKey: .id)
        familyId = try c.decode(UUID.self,   forKey: .familyId)
        name     = try c.decode(String.self, forKey: .name)
        category = try c.decode(String.self, forKey: .category)

        // PostgREST returns `numeric` columns as quoted strings ("3.00").
        // Try Double first (backend API path), fall back to String → Double (Supabase path).
        if let q = try? c.decode(Double.self, forKey: .quantity) {
            quantity = q
        } else {
            let s = try c.decode(String.self, forKey: .quantity)
            quantity = Double(s) ?? 0
        }

        // PostgREST returns `date` columns as "YYYY-MM-DD" (no time component),
        // which the Supabase SDK's ISO8601 parser rejects.
        // The backend returns full ISO8601 ("2026-05-04T00:00:00Z") which works fine.
        if let date = try? c.decodeIfPresent(Date.self, forKey: .expiryDate) {
            expiryDate = date
        } else if let raw = try? c.decodeIfPresent(String.self, forKey: .expiryDate) {
            let df = DateFormatter()
            df.locale = Locale(identifier: "en_US_POSIX")
            df.dateFormat = "yyyy-MM-dd"
            expiryDate = df.date(from: raw)
        } else {
            expiryDate = nil
        }
    }
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
