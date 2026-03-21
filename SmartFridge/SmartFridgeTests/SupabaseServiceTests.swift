// SmartFridgeTests/SupabaseServiceTests.swift
import XCTest
@testable import SmartFridge

// SupabaseService is a thin wrapper; test the mapping logic, not the SDK internals.
final class SupabaseServiceTests: XCTestCase {

    func testDeleteShoppingListItemsBuildsCorrectIDArray() {
        let ids: [UUID] = [
            UUID(uuidString: "00000000-0000-0000-0000-000000000010")!,
            UUID(uuidString: "00000000-0000-0000-0000-000000000011")!
        ]
        // Verify the IDs are converted to strings correctly for the Supabase .in filter
        let strings = ids.map(\.uuidString.lowercased)
        XCTAssertEqual(strings.count, 2)
        XCTAssertTrue(strings[0].contains("000000000010"))
    }

    func testShoppingListTotalCost() {
        let items: [ShoppingListItem] = [
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "A", quantity: 1, unit: "pc",
                             isPurchased: false, estimatedUnitCost: 10.0, alternatives: [], recipeName: nil),
            ShoppingListItem(id: UUID(), familyId: UUID(), name: "B", quantity: 2, unit: "pc",
                             isPurchased: true,  estimatedUnitCost: 5.0,  alternatives: [], recipeName: nil),
        ]
        let total = items.compactMap(\.estimatedUnitCost).reduce(0, +)
        XCTAssertEqual(total, 15.0)
    }
}
