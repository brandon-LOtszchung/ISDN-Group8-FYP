// Services/InventoryAPIService.swift
import Foundation
import UIKit

final class InventoryAPIService {
    static let shared = InventoryAPIService()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    /// Uploads one or more photos to /api/inventory/initialize.
    /// The endpoint accepts an `images` multipart field (can be sent multiple times).
    func initializeInventory(images: [UIImage], familyId: UUID) async throws -> [InventoryItem] {
        let url = URL(string: "\(Config.apiBaseURL)/api/inventory/initialize")!
        print("[InventoryAPI] → POST \(url) | images: \(images.count) | familyId: \(familyId)")

        let boundary = UUID().uuidString
        var request = URLRequest(url: url, timeoutInterval: 120)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = SupabaseService.shared.currentAccessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("[InventoryAPI] Auth token attached (length: \(token.count))")
        } else {
            print("[InventoryAPI] ⚠️ No auth token — request will be sent unauthenticated")
        }

        var body = Data()
        for (i, image) in images.enumerated() {
            let resized = image.resizedForUpload(maxDimension: 1024)
            guard let imageData = resized.jpegData(compressionQuality: 0.6) else {
                print("[InventoryAPI] ⚠️ Image \(i) failed JPEG conversion — skipped")
                continue
            }
            print("[InventoryAPI] Image \(i): \(imageData.count / 1024) KB (was \(Int(image.size.width))×\(Int(image.size.height)))")
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"images\"; filename=\"fridge.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"family_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(familyId.uuidString)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        print("[InventoryAPI] Sending request (body: \(body.count / 1024) KB) …")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let http = response as? HTTPURLResponse
            print("[InventoryAPI] ← HTTP \(http?.statusCode ?? -1)")
            guard let http, (200..<300).contains(http.statusCode) else {
                print("[InventoryAPI] ✗ Bad status — raw body: \(String(data: data, encoding: .utf8) ?? "<binary>")")
                throw URLError(.badServerResponse)
            }
            print("[InventoryAPI] Raw response: \(String(data: data, encoding: .utf8) ?? "<binary>")")
            let items = try decoder.decode([InventoryItem].self, from: data)
            print("[InventoryAPI] ✓ Decoded \(items.count) item(s)")
            return items
        } catch {
            print("[InventoryAPI] ✗ Error: \(error)")
            throw error
        }
    }
}

private extension UIImage {
    func resizedForUpload(maxDimension: CGFloat) -> UIImage {
        let longest = max(size.width, size.height)
        guard longest > maxDimension else { return self }
        let scale = maxDimension / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}
