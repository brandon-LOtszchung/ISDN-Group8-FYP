// SmartFridgeTests/CameraAPIServiceTests.swift
import XCTest
@testable import SmartFridge

final class CameraAPIServiceTests: XCTestCase {

    // MARK: - Validation: empty / whitespace-only cameraId

    func test_pairCamera_emptyCameraId_throws() async throws {
        #if DEBUG
        print("[CameraAPIServiceTests] test_pairCamera_emptyCameraId_throws")
        #endif
        do {
            _ = try await CameraAPIService.shared.pairCamera(cameraId: "")
            XCTFail("Expected an error to be thrown for empty cameraId")
        } catch let error as URLError {
            XCTAssertEqual(error.code, .badURL)
            XCTAssertTrue(
                error.localizedDescription.contains("camera_id cannot be empty"),
                "Expected error message to contain 'camera_id cannot be empty', got: \(error.localizedDescription)"
            )
        }
    }

    func test_pairCamera_whitespaceCameraId_throws() async throws {
        #if DEBUG
        print("[CameraAPIServiceTests] test_pairCamera_whitespaceCameraId_throws")
        #endif
        do {
            _ = try await CameraAPIService.shared.pairCamera(cameraId: "   ")
            XCTFail("Expected an error to be thrown for whitespace-only cameraId")
        } catch let error as URLError {
            XCTAssertEqual(error.code, .badURL)
            XCTAssertTrue(
                error.localizedDescription.contains("camera_id cannot be empty"),
                "Expected error message to contain 'camera_id cannot be empty', got: \(error.localizedDescription)"
            )
        }
    }

    // MARK: - Validation: trimming behaviour

    func test_pairCamera_trimsCameraId_rejectsWhitespaceOnly() async throws {
        // The service trims whitespace before validation.
        // A whitespace-only string ("  0001  " trimmed to "0001") passes validation and
        // proceeds to the network call; a whitespace-only string ("   ") trimmed to ""
        // must be rejected before any network I/O.
        #if DEBUG
        print("[CameraAPIServiceTests] test_pairCamera_trimsCameraId_rejectsWhitespaceOnly")
        #endif
        // Confirm whitespace-only input is caught after trimming.
        do {
            _ = try await CameraAPIService.shared.pairCamera(cameraId: "\t  \t")
            XCTFail("Expected error for tab+whitespace-only cameraId")
        } catch let error as URLError {
            XCTAssertEqual(error.code, .badURL)
        }
    }

    // MARK: - Model decoding

    func test_cameraPairResponse_decodesCorrectly() throws {
        #if DEBUG
        print("[CameraAPIServiceTests] test_cameraPairResponse_decodesCorrectly")
        #endif
        let json = """
        {"camera_id": "0001", "family_id": "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"}
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(CameraPairResponse.self, from: json)

        XCTAssertEqual(response.cameraId, "0001")
        XCTAssertEqual(response.familyId, "eef3fcba-7b07-4c18-82dc-50dfe60b97ac")
    }

    func test_cameraPairResponse_decodesWithExplicitCodingKeys() throws {
        // CameraPairResponse uses explicit CodingKeys (not convertFromSnakeCase),
        // so verify direct JSONDecoder (default strategy) also works via the explicit keys.
        #if DEBUG
        print("[CameraAPIServiceTests] test_cameraPairResponse_decodesWithExplicitCodingKeys")
        #endif
        let json = """
        {"camera_id": "CAM-42", "family_id": "aaaabbbb-0000-1111-2222-ccccddddeeee"}
        """.data(using: .utf8)!

        // Use the default decoder — the struct's explicit CodingKeys map snake_case keys.
        let response = try JSONDecoder().decode(CameraPairResponse.self, from: json)

        XCTAssertEqual(response.cameraId, "CAM-42")
        XCTAssertEqual(response.familyId, "aaaabbbb-0000-1111-2222-ccccddddeeee")
    }

    // MARK: - Network integration tests (require live server)

    func test_pairCamera_400Response_throwsWithDetail() async throws {
        // Integration test — requires network
        try XCTSkipIf(true, "Requires live server: verifies 400 response parses detail message")
        #if DEBUG
        print("[CameraAPIServiceTests] test_pairCamera_400Response_throwsWithDetail")
        #endif
        // When the server returns HTTP 400 with body {"detail":"camera_id cannot be empty"},
        // pairCamera should throw a URLError whose localizedDescription contains that message.
        do {
            _ = try await CameraAPIService.shared.pairCamera(cameraId: "INVALID_TRIGGER_400")
            XCTFail("Expected error for 400 response")
        } catch let error as URLError {
            XCTAssertTrue(
                error.localizedDescription.contains("camera_id cannot be empty"),
                "Expected detail message in error, got: \(error.localizedDescription)"
            )
        }
    }

    func test_pairCamera_successResponse_returnsCameraPairResponse() async throws {
        // Integration test — requires network
        try XCTSkipIf(true, "Requires live server: verifies successful pair returns CameraPairResponse")
        #if DEBUG
        print("[CameraAPIServiceTests] test_pairCamera_successResponse_returnsCameraPairResponse")
        #endif
        // When the server returns HTTP 200 with valid JSON, pairCamera should decode and
        // return a CameraPairResponse with the expected cameraId and familyId.
        let response = try await CameraAPIService.shared.pairCamera(cameraId: "0001")
        XCTAssertFalse(response.cameraId.isEmpty, "Returned cameraId should not be empty")
        XCTAssertFalse(response.familyId.isEmpty, "Returned familyId should not be empty")
    }
}
