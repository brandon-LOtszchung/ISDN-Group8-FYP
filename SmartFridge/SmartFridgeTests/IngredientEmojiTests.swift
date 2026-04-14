// SmartFridgeTests/IngredientEmojiTests.swift
import XCTest
@testable import SmartFridge

final class IngredientEmojiTests: XCTestCase {

    func test_exactMatch_carrot() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Carrot"), "🥕")
    }

    func test_exactMatch_egg() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Egg"), "🥚")
    }

    func test_exactMatch_milk() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Milk"), "🥛")
    }

    func test_caseInsensitive_uppercase() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "CHICKEN"), "🍗")
    }

    func test_caseInsensitive_mixed() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Fresh Carrots"), "🥕")
    }

    func test_substringMatch_withQualifier() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Organic Broccoli"), "🥦")
    }

    func test_specificBeforeGeneral_springOnion() {
        // "spring onion" is more specific than "onion" — must match 🌿, not 🧅
        XCTAssertEqual(IngredientEmoji.emoji(for: "Spring Onion"), "🌿")
    }

    func test_specificBeforeGeneral_oysteSauce() {
        // "oyster sauce" must match 🫙, not "oyster" → 🦪
        XCTAssertEqual(IngredientEmoji.emoji(for: "Oyster Sauce"), "🫙")
    }

    func test_unknownIngredient_fallback() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Xyzzy"), "🛒")
    }

    func test_emptyString_fallback() {
        XCTAssertEqual(IngredientEmoji.emoji(for: ""), "🛒")
    }
}
