// Services/InventoryAPIService.swift
import Foundation
import UIKit

final class InventoryAPIService {
    static let shared = InventoryAPIService()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()

    /// Uploads one or more photos to /api/inventory/initialize.
    /// The endpoint accepts an `images` multipart field (can be sent multiple times).
    func initializeInventory(images: [UIImage], familyId: UUID) async throws -> [InventoryItem] {
        let url = URL(string: "\(Config.apiBaseURL)/api/inventory/initialize")!
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        for image in images {
            guard let imageData = image.jpegData(compressionQuality: 0.8) else { continue }
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"images\"; filename=\"fridge.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        // Append family_id field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"family_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(familyId.uuidString)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        let (data, _) = try await URLSession.shared.data(for: request)
        return try decoder.decode([InventoryItem].self, from: data)
    }
}
