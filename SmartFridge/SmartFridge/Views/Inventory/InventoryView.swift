// Views/Inventory/InventoryView.swift
import SwiftUI

struct InventoryView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @State private var searchText = ""
    @State private var showCamera = false
    @State private var showScanPrompt = false

    private var groupedInventory: [String: [InventoryItem]] {
        let filtered = searchText.isEmpty
            ? appVM.inventory
            : appVM.inventory.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        return Dictionary(grouping: filtered, by: \.category)
    }

    var body: some View {
        Group {
            if appVM.inventory.isEmpty && !appVM.isLoading {
                ContentUnavailableView(
                    String(localized: "inventory.empty"),
                    systemImage: "refrigerator",
                    description: Text("Tap the camera icon to scan your fridge.")
                )
            } else {
                inventoryList
            }
        }
        .navigationTitle(String(localized: "inventory.title"))
        .searchable(text: $searchText, prompt: String(localized: "inventory.search"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCamera = true } label: {
                    Image(systemName: "camera.fill").foregroundStyle(theme.colors.scan)
                }
                .accessibilityLabel("Scan fridge")
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraPickerView(isPresented: $showCamera)
        }
        .sheet(isPresented: $showScanPrompt) {
            ScanPromptView(showCamera: $showCamera, isPresented: $showScanPrompt)
                .presentationDetents([.medium])
        }
        .onAppear {
            if !appVM.fridgeInitialized && appVM.inventory.isEmpty {
                showScanPrompt = true
            }
        }
        .topBarToolbar()
    }

    private var inventoryList: some View {
        List {
            ForEach(groupedInventory.keys.sorted(), id: \.self) { category in
                Section(category) {
                    ForEach(groupedInventory[category] ?? []) { item in
                        InventoryItemRow(item: item)
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    appVM.removeItem(id: item.id)
                                } label: {
                                    Label(String(localized: "common.delete"), systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }
}
