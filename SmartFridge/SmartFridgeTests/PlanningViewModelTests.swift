// SmartFridgeTests/PlanningViewModelTests.swift
import XCTest
@testable import SmartFridge

@MainActor
final class PlanningViewModelTests: XCTestCase {

    func testToggleMemberSelection() {
        let vm = PlanningViewModel()
        let id = UUID()
        vm.toggleMember(id)
        XCTAssertTrue(vm.selectedMemberIds.contains(id))
        vm.toggleMember(id)
        XCTAssertFalse(vm.selectedMemberIds.contains(id))
    }

    func testMatchPercentage() {
        let rec = RecipeRecommendation(
            savedRecipeId: "1", name: "Test", cuisineStyle: "Chinese",
            matchedCount: 7, totalCount: 10, missingCount: 3
        )
        XCTAssertEqual(rec.matchPercentage, 70)
    }
}
