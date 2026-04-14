// SmartFridgeTests/RecipeHeroTests.swift
import XCTest
@testable import SmartFridge

final class RecipeHeroTests: XCTestCase {

    // MARK: - Gradient hex pair

    func test_hexPair_cantonese_caseInsensitive() {
        XCTAssertEqual(RecipeHero.hexPair(for: "Cantonese").0,
                       RecipeHero.hexPair(for: "cantonese").0)
    }

    func test_hexPair_knownCuisines() {
        XCTAssertEqual(RecipeHero.hexPair(for: "cantonese").0,  "#FFE0C0")
        XCTAssertEqual(RecipeHero.hexPair(for: "sichuan").0,    "#FFCDC5")
        XCTAssertEqual(RecipeHero.hexPair(for: "japanese").0,   "#FFE4E8")
        XCTAssertEqual(RecipeHero.hexPair(for: "korean").0,     "#FFD8B8")
        XCTAssertEqual(RecipeHero.hexPair(for: "filipino").0,   "#E8D8C0")
        XCTAssertEqual(RecipeHero.hexPair(for: "indonesian").0, "#FFF0C0")
    }

    func test_hexPair_unknownCuisine_returnsFallback() {
        XCTAssertEqual(RecipeHero.hexPair(for: "Mystery Cuisine").0, "#FFF0E8")
        XCTAssertEqual(RecipeHero.hexPair(for: "Mystery Cuisine").1, "#FFBA7A")
    }

    // MARK: - Emoji

    func test_emoji_chicken() {
        XCTAssertEqual(RecipeHero.emoji(for: "Steamed Chicken with Ginger"), "🍗")
    }

    func test_emoji_friedRice() {
        XCTAssertEqual(RecipeHero.emoji(for: "Garlic Fried Rice"), "🍳")
    }

    func test_emoji_teriyakiSalmon() {
        XCTAssertEqual(RecipeHero.emoji(for: "Teriyaki Salmon"), "🐟")
    }

    func test_emoji_mapoTofu() {
        XCTAssertEqual(RecipeHero.emoji(for: "Mapo Tofu"), "🫕")
    }

    func test_emoji_nasiGoreng() {
        XCTAssertEqual(RecipeHero.emoji(for: "Nasi Goreng"), "🍜")
    }

    func test_emoji_bokChoy() {
        XCTAssertEqual(RecipeHero.emoji(for: "Bok Choy with Oyster Sauce"), "🥬")
    }

    func test_emoji_bibimbap() {
        XCTAssertEqual(RecipeHero.emoji(for: "Bibimbap"), "🥘")
    }

    func test_emoji_chickenAdobo() {
        XCTAssertEqual(RecipeHero.emoji(for: "Chicken Adobo"), "🍗")
    }

    func test_emoji_caseInsensitive() {
        XCTAssertEqual(RecipeHero.emoji(for: "TERIYAKI SALMON"),
                       RecipeHero.emoji(for: "teriyaki salmon"))
    }

    func test_emoji_unknown_returnsFallback() {
        XCTAssertEqual(RecipeHero.emoji(for: "Mystery Dish"), "🍽️")
    }

    func test_emoji_empty_returnsFallback() {
        XCTAssertEqual(RecipeHero.emoji(for: ""), "🍽️")
    }
}
