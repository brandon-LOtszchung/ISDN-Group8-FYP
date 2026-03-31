// Views/Inventory/CameraPickerView.swift
import SwiftUI
import PhotosUI
import UIKit

struct CameraPickerView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Binding var isPresented: Bool

    @State private var photoPickerItems: [PhotosPickerItem] = []
    @State private var showCamera = false
    @State private var isUploading = false
    @State private var uploadError: String?
    @State private var uploadResult: Int?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if isUploading {
                    ProgressView(String(localized: "camera.scanning"))
                        .padding(.top, 60)
                } else if let count = uploadResult {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(theme.colors.success)
                            .symbolEffect(.bounce)
                        Text(String(format: String(localized: "camera.items_found"), count))
                            .font(.title3.bold())
                        Text(String(localized: "camera.scan_success"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 60)
                    .task(id: count) {
                        try? await Task.sleep(for: .seconds(1.5))
                        isPresented = false
                    }
                } else {
                    // Camera button
                    Button {
                        showCamera = true
                    } label: {
                        Label(String(localized: "camera.take_photo"), systemImage: "camera.fill")
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.colors.scan)
                    .controlSize(.large)

                    // Library picker (supports up to 3 images)
                    PhotosPicker(
                        selection: $photoPickerItems,
                        maxSelectionCount: 3,
                        matching: .images
                    ) {
                        Label(String(localized: "camera.choose_library"), systemImage: "photo.on.rectangle")
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.colors.primary)
                    .controlSize(.large)
                    .onChange(of: photoPickerItems) { _, items in
                        guard !items.isEmpty else { return }
                        Task { await uploadLibraryPhotos(items) }
                    }
                }
            }
            .padding(.horizontal, 24)
            .navigationTitle(String(localized: "camera.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "camera.cancel")) { isPresented = false }
                }
            }
            .alert(String(localized: "camera.upload_error"), isPresented: Binding(
                get: { uploadError != nil },
                set: { if !$0 { uploadError = nil } }
            )) {
                Button(String(localized: "common.done")) { uploadError = nil }
            } message: {
                Text(uploadError ?? "")
            }
        }
        // Camera sheet — UIImagePickerController (sourceType: .camera)
        .sheet(isPresented: $showCamera) {
            CameraCaptureBridge { image in
                showCamera = false
                Task { await upload(images: [image]) }
            }
            .ignoresSafeArea()
        }
    }

    private func uploadLibraryPhotos(_ items: [PhotosPickerItem]) async {
        var images: [UIImage] = []
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                images.append(image)
            }
        }
        await upload(images: images)
    }

    private func upload(images: [UIImage]) async {
        guard !images.isEmpty else { return }
        isUploading = true
        defer { isUploading = false }
        do {
            let detected = try await InventoryAPIService.shared.initializeInventory(
                images: images,
                familyId: Constants.defaultFamilyID
            )
            for item in detected { appVM.addItem(item) }
            appVM.fridgeInitialized = true
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            uploadResult = detected.count
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            uploadError = error.localizedDescription
        }
    }
}

// MARK: - UIImagePickerController bridge (camera only)

private struct CameraCaptureBridge: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage { onCapture(image) }
        }
    }
}
