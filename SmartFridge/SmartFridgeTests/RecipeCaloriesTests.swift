// SmartFridgeTests/RecipeCaloriesTests.swift
import XCTest
@testable import SmartFridge

final class RecipeCaloriesTests: XCTestCase {

    func test_knownRecipe_exactCase() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Steamed Chicken with Ginger"), 320)
    }

    func test_knownRecipe_uppercased() {
        XCTAssertEqual(RecipeCalories.estimate(for: "MAPO TOFU"), 380)
    }

    func test_knownRecipe_mixedCase() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Garlic Fried Rice"), 410)
    }

    func test_knownRecipe_lowCalorie() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Bok Choy with Oyster Sauce"), 95)
    }

    func test_unknownRecipe_returnsNil() {
        XCTAssertNil(RecipeCalories.estimate(for: "Unknown Mystery Dish"))
    }

    func test_emptyString_returnsNil() {
        XCTAssertNil(RecipeCalories.estimate(for: ""))
    }
}
