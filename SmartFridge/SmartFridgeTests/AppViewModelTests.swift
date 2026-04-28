// SmartFridgeTests/AppViewModelTests.swift
import XCTest
@testable import SmartFridge

@MainActor
final class AppViewModelTests: XCTestCase {

    func testOnboardingDefaultsToFalse() {
        UserDefaults.standard.removeObject(forKey: Constants.StorageKeys.hasCompletedOnboarding)
        let vm = AppViewModel()
        XCTAssertFalse(vm.hasCompletedOnboarding)
    }

    func testCompleteOnboardingPersists() {
        UserDefaults.standard.removeObject(forKey: Constants.StorageKeys.hasCompletedOnboarding)
        let vm = AppViewModel()
        vm.completeOnboarding()
        XCTAssertTrue(vm.hasCompletedOnboarding)
        XCTAssertTrue(UserDefaults.standard.bool(forKey: Constants.StorageKeys.hasCompletedOnboarding))
    }

    func testAddInventoryItemAppendsToList() {
        let vm = AppViewModel()
        let item = InventoryItem(id: UUID(), familyId: UUID(), name: "Egg", category: "Dairy & Eggs", quantity: 6)
        vm.addLocalItem(item)
        XCTAssertTrue(vm.inventory.contains(where: { $0.id == item.id }))
    }

    func testRemoveInventoryItemRemovesFromList() {
        let vm = AppViewModel()
        let item = InventoryItem(id: UUID(), familyId: UUID(), name: "Milk", category: "Dairy & Eggs", quantity: 1)
        vm.addLocalItem(item)
        vm.removeLocalItem(id: item.id)
        XCTAssertFalse(vm.inventory.contains(where: { $0.id == item.id }))
    }

    func testFridgeInitializedDefaultsToFalse() {
        UserDefaults.standard.removeObject(forKey: Constants.StorageKeys.fridgeInitialized)
        let vm = AppViewModel()
        XCTAssertFalse(vm.fridgeInitialized)
    }

    func testAddMemberAppendsToList() {
        let vm = AppViewModel()
        let member = FamilyMember(
            id: UUID(),
            familyId: UUID(),
            name: "Test",
            age: nil,
            dietaryRestrictions: [],
            allergies: [],
            healthConditions: [],
            spiceLevel: nil,
            favoriteCuisines: [],
            dislikedIngredients: []
        )
        vm.addMember(member)
        XCTAssertTrue(vm.members.contains(where: { $0.id == member.id }))
    }

    func testDeleteMemberRemovesFromList() {
        let vm = AppViewModel()
        let member = FamilyMember(
            id: UUID(),
            familyId: UUID(),
            name: "ToDelete",
            age: nil,
            dietaryRestrictions: [],
            allergies: [],
            healthConditions: [],
            spiceLevel: nil,
            favoriteCuisines: [],
            dislikedIngredients: []
        )
        vm.members = [member]
        vm.deleteMember(id: member.id)
        XCTAssertFalse(vm.members.contains(where: { $0.id == member.id }))
    }
}
