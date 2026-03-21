// SmartFridgeTests/RecipeAPIServiceTests.swift
import XCTest
@testable import SmartFridge

final class RecipeAPIServiceTests: XCTestCase {

    func testRecommendURLIsCorrect() throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/recommend")!
        XCTAssertEqual(url.host, "152.42.221.192")
        XCTAssertEqual(url.port, 8000)
        XCTAssertEqual(url.path, "/api/recipes/recommend")
    }

    func testRecipeDetailURLIsCorrect() throws {
        let recipeID = "abc123"
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/\(recipeID)")!
        XCTAssertTrue(url.path.hasSuffix("/abc123"))
    }

    func testAddToShoppingListURLIsCorrect() throws {
        let recipeID = "abc123"
        let url = URL(string: "\(Config.apiBaseURL)/api/recipes/\(recipeID)/add-to-shopping-list")!
        XCTAssertTrue(url.path.hasSuffix("/add-to-shopping-list"))
    }
}
