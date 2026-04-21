// SmartFridgeTests/ShoppingViewModelTests.swift
import XCTest
@testable import SmartFridge

@MainActor
final class ShoppingViewModelTests: XCTestCase {

    func testTotalCostSumsEstimatedCosts() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "A", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: 20.0, alternatives: [], recipeName: nil),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "B", quantity: 1, unit: "pc",
                             isPurchased: true,  estimatedUnitCost: 15.0, alternatives: [], recipeName: nil),
        ]
        XCTAssertEqual(vm.totalEstimatedCost, 35.0)
    }

    func testPurchasedItemIDs() {
        let vm = ShoppingViewModel()
        let idA = UUID()
        let idB = UUID()
        vm.items = [
            ShoppingListItem(id: idA, familyId: UUID(), name: "A", quantity: 1, unit: "pc",
                             isPurchased: true,  estimatedUnitCost: nil, alternatives: [], recipeName: nil),
            ShoppingListItem(id: idB, familyId: UUID(), name: "B", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: nil),
        ]
        XCTAssertEqual(vm.purchasedItemIDs, [idA])
    }

    func testItemsGroupedByRecipe() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "A", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "B", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "C", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Salmon"),
        ]
        let groups = vm.itemsGroupedByRecipe
        XCTAssertEqual(groups["Stir Fry"]?.count, 2)
        XCTAssertEqual(groups["Salmon"]?.count, 1)
    }

    // MARK: - Aggregation

    func testAggregatedItemsMergesSameIngredientAcrossRecipes() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 3, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Onion", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
        ]
        let aggregated = vm.aggregatedItems
        XCTAssertEqual(aggregated.count, 2)
        let garlic = aggregated.first { $0.name == "Garlic" }
        XCTAssertEqual(garlic?.totalQuantity, 5)
        XCTAssertEqual(garlic?.sources.count, 2)
    }

    func testAggregatedItemsDoesNotMergeDifferentUnits() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 10, unit: "g",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
        ]
        XCTAssertEqual(vm.aggregatedItems.count, 2)
    }

    func testAggregatedIsPurchasedRequiresAllSources() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: true,  estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 3, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
        ]
        let garlic = vm.aggregatedItems.first!
        XCTAssertFalse(garlic.isPurchased)
        XCTAssertTrue(garlic.isPartiallyPurchased)
    }

    func testAggregatedPurchasedCount() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: true,  estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 3, unit: "cloves",
                             isPurchased: true,  estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Onion", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
        ]
        XCTAssertEqual(vm.aggregatedPurchasedCount, 1)
    }

    func testToggleAggregatedMarksAllSourcesPurchased() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 3, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
        ]
        let aggregated = vm.aggregatedItems.first!
        vm.toggleAggregated(aggregated)
        XCTAssertTrue(vm.items.allSatisfy(\.isPurchased))
    }

    func testRemoveAggregatedDeletesAllSources() {
        let vm = ShoppingViewModel()
        vm.items = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 2, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Garlic", quantity: 3, unit: "cloves",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Pasta"),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "Onion", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: nil, alternatives: [], recipeName: "Stir Fry"),
        ]
        let garlic = vm.aggregatedItems.first { $0.name == "Garlic" }!
        vm.removeAggregated(garlic)
        XCTAssertEqual(vm.items.count, 1)
        XCTAssertEqual(vm.items[0].name, "Onion")
    }
}
