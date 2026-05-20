// Services/CameraAPIService.swift
import Foundation

struct CameraPairResponse: Codable {
    let cameraId: String
    let familyId: String
}

final class CameraAPIService {
    static let shared = CameraAPIService()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    func pairCamera(cameraId: String) async throws -> CameraPairResponse {
        let trimmed = cameraId.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else {
            throw URLError(.badURL, userInfo: [
                NSLocalizedDescriptionKey: "camera_id cannot be empty"
            ])
        }

        guard let url = URL(string: "\(Config.apiBaseURL)/api/cameras/pair") else {
            throw URLError(.badURL)
        }
#if DEBUG
        print("[CameraAPI] → POST \(url) | cameraId=\(trimmed)")
#endif

        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let token = try await SupabaseService.shared.freshAccessToken()
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let body = ["camera_id": trimmed]
        request.httpBody = try JSONEncoder().encode(body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let http = response as? HTTPURLResponse
#if DEBUG
            print("[CameraAPI] ← HTTP \(http?.statusCode ?? -1)")
            print("[CameraAPI] Raw response: \(String(data: data, encoding: .utf8) ?? "<binary>")")
#endif

            if http?.statusCode == 400 {
                struct ErrorDetail: Decodable { let detail: String }
                if let detail = try? decoder.decode(ErrorDetail.self, from: data) {
#if DEBUG
                    print("[CameraAPI] ✗ 400 detail: \(detail.detail)")
#endif
                    throw URLError(.badURL, userInfo: [NSLocalizedDescriptionKey: detail.detail])
                }
                throw URLError(.badServerResponse, userInfo: [
                    NSLocalizedDescriptionKey: "Bad request (400)"
                ])
            }

            guard let http, (200..<300).contains(http.statusCode) else {
                throw URLError(.badServerResponse, userInfo: [
                    NSLocalizedDescriptionKey: "Server error (\(http?.statusCode ?? -1))"
                ])
            }

            let result = try decoder.decode(CameraPairResponse.self, from: data)
#if DEBUG
            print("[CameraAPI] ✓ Decoded — cameraId=\(result.cameraId) familyId=\(result.familyId)")
#endif
            return result
        } catch {
#if DEBUG
            print("[CameraAPI] ✗ Error: \(error)")
#endif
            throw error
        }
    }
}
