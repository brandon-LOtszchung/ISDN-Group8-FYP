import XCTest
@testable import SmartFridge

final class BudgetSliderTests: XCTestCase {

    func test_budgetTier_10_isLow() {
        let tier = budgetTier(for: 10)
        XCTAssertEqual(tier.value, "low")
        XCTAssertEqual(tier.label, "Budget-Friendly")
    }

    func test_budgetTier_49_isStillLow() {
        XCTAssertEqual(budgetTier(for: 49).value, "low")
    }

    func test_budgetTier_50_isMedium() {
        let tier = budgetTier(for: 50)
        XCTAssertEqual(tier.value, "medium")
        XCTAssertEqual(tier.label, "Moderate")
    }

    func test_budgetTier_99_isStillMedium() {
        XCTAssertEqual(budgetTier(for: 99).value, "medium")
    }

    func test_budgetTier_100_isHigh() {
        let tier = budgetTier(for: 100)
        XCTAssertEqual(tier.value, "high")
        XCTAssertEqual(tier.label, "Premium")
    }

    func test_budgetTier_150_isStillHigh() {
        XCTAssertEqual(budgetTier(for: 150).value, "high")
    }

    func test_budgetTier_default50_isMedium() {
        // The slider default is HK$50 — must map to "medium"
        XCTAssertEqual(budgetTier(for: 50).value, "medium")
    }
}
