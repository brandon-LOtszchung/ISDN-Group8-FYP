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
}
