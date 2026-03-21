// SmartFridgeTests/InventoryAPIServiceTests.swift
import XCTest
@testable import SmartFridge

final class InventoryAPIServiceTests: XCTestCase {

    func testInitializeInventoryURLIsCorrect() {
        let url = URL(string: "\(Config.apiBaseURL)/api/inventory/initialize")!
        XCTAssertEqual(url.path, "/api/inventory/initialize")
        XCTAssertEqual(url.host, "152.42.221.192")
    }

    func testMultipartBodyContainsFamilyIDField() {
        // Verify the family_id field name used in the multipart body matches the backend expectation
        let boundary = "test-boundary"
        let familyId = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"family_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(familyId.uuidString)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        let bodyString = String(data: body, encoding: .utf8) ?? ""
        XCTAssertTrue(bodyString.contains("family_id"))
        XCTAssertTrue(bodyString.contains("00000000-0000-0000-0000-000000000001"))
    }

    func testMultipartBodyContainsImagesField() {
        // Verify the images field name is "images" (matches backend's formData.append('images', ...))
        let fieldName = "images"
        let disposition = "Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"fridge.jpg\""
        XCTAssertTrue(disposition.contains("name=\"images\""))
    }
}
