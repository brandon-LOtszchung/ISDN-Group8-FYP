// SmartFridgeTests/ModelTests.swift
import XCTest
@testable import SmartFridge

final class ModelTests: XCTestCase {
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()

    func testShoppingListItemDecodesSnakeCase() throws {
        let json = """
        {
          "id": "00000000-0000-0000-0000-000000000002",
          "family_id": "00000000-0000-0000-0000-000000000001",
          "name": "Oyster Sauce",
          "quantity": 1.0,
          "unit": "bottle",
          "is_purchased": false,
          "estimated_unit_cost": 18.0,
          "alternatives": ["Hoisin Sauce"],
          "recipe_name": "Stir Fry"
        }
        """.data(using: .utf8)!
        let item = try decoder.decode(ShoppingListItem.self, from: json)
        XCTAssertEqual(item.name, "Oyster Sauce")
        XCTAssertFalse(item.isPurchased)
        XCTAssertEqual(item.estimatedUnitCost, 18.0)
        XCTAssertEqual(item.recipeName, "Stir Fry")
    }

    func testRecipeRecommendationDecodes() throws {
        let json = """
        {
          "saved_recipe_id": "abc123",
          "name": "Broccoli Beef",
          "cuisine_style": "Chinese",
          "matched_count": 5,
          "total_count": 7,
          "missing_count": 2
        }
        """.data(using: .utf8)!
        let rec = try decoder.decode(RecipeRecommendation.self, from: json)
        XCTAssertEqual(rec.savedRecipeId, "abc123")
        XCTAssertEqual(rec.missingCount, 2)
    }

    func testRecipeRecommendationCaloriesNilWhenAbsent() throws {
        let json = """
        {
          "saved_recipe_id": "abc123",
          "name": "Broccoli Beef",
          "cuisine_style": "Chinese",
          "matched_count": 5,
          "total_count": 7,
          "missing_count": 2
        }
        """.data(using: .utf8)!
        let rec = try decoder.decode(RecipeRecommendation.self, from: json)
        XCTAssertNil(rec.calories, "calories must be nil when the API omits the field")
    }

    func testRecipeRecommendationCaloriesDecodedWhenPresent() throws {
        let json = """
        {
          "saved_recipe_id": "def456",
          "name": "Teriyaki Salmon",
          "cuisine_style": "Japanese",
          "matched_count": 4,
          "total_count": 6,
          "missing_count": 2,
          "calories": 350
        }
        """.data(using: .utf8)!
        let rec = try decoder.decode(RecipeRecommendation.self, from: json)
        XCTAssertEqual(rec.calories, 350)
    }

    func testFamilyMemberDecodesFlat() throws {
        // Flat schema matching the Supabase DB columns
        let json = """
        {
          "id": "00000000-0000-0000-0000-000000000003",
          "family_id": "00000000-0000-0000-0000-000000000001",
          "name": "Dad",
          "age": 45,
          "dietary_restrictions": ["Halal"],
          "allergies": [],
          "health_conditions": [],
          "spice_level": "mild",
          "favorite_cuisines": ["Chinese"],
          "disliked_ingredients": []
        }
        """.data(using: .utf8)!
        let member = try decoder.decode(FamilyMember.self, from: json)
        XCTAssertEqual(member.name, "Dad")
        XCTAssertEqual(member.spiceLevel, "mild")
        XCTAssertEqual(member.favoriteCuisines, ["Chinese"])
    }
}
