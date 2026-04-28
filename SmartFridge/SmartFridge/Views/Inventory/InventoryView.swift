// Views/Inventory/InventoryView.swift
import SwiftUI

struct InventoryView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @State private var searchText = ""
    @State private var showCamera = false
    @State private var showScanPromptInline = false
    @State private var showAddForm = false
    @State private var editingItem: InventoryItem?
    @State private var itemToDelete: InventoryItem?

    private var groupedInventory: [String: [InventoryItem]] {
        let filtered = searchText.isEmpty
            ? appVM.inventory
            : appVM.inventory.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        return Dictionary(grouping: filtered, by: \.category)
    }

    var body: some View {
        Group {
            if appVM.isLoading && appVM.inventory.isEmpty {
                VStack {
                    Spacer()
                    LoadingPhaseView(config: .inventoryInit)
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if appVM.inventory.isEmpty {
                if !appVM.fridgeInitialized {
                    ScanPromptView(showCamera: $showCamera, isPresented: $showScanPromptInline)
                } else {
                    ContentUnavailableView(
                        String(localized: "inventory.empty"),
                        systemImage: "refrigerator",
                        description: Text(String(localized: "inventory.camera_scan_hint"))
                    )
                }
            } else {
                inventoryList
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background {
            NeuBackground(screen: .inventory)
                .environment(theme)
        }
        .navigationTitle(String(localized: "inventory.title"))
        .searchable(text: $searchText, prompt: String(localized: "inventory.search"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 16) {
                    Button { showAddForm = true } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel(String(localized: "inventory.add_item"))

                    Button { showCamera = true } label: {
                        Image(systemName: "camera.fill").foregroundStyle(theme.colors.scan)
                    }
                    .accessibilityLabel("Scan fridge")
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraPickerView(isPresented: $showCamera)
        }
        .sheet(isPresented: $showAddForm) {
            InventoryItemFormView(item: nil)
        }
        .sheet(item: $editingItem) { item in
            InventoryItemFormView(item: item)
        }
        .topBarToolbar()
        .alert(String(localized: "common.error"), isPresented: Binding(
            get: { appVM.error != nil },
            set: { if !$0 { appVM.error = nil } }
        )) {
            Button(String(localized: "common.done")) { appVM.error = nil }
        } message: { Text(appVM.error ?? "") }
    }

    private var inventoryList: some View {
        List {
            ForEach(groupedInventory.keys.sorted(), id: \.self) { category in
                Section(category) {
                    ForEach(groupedInventory[category] ?? []) { item in
                        InventoryItemRow(item: item, onEdit: { editingItem = item })
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    itemToDelete = item
                                } label: {
                                    Label(String(localized: "common.delete"), systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background {
            NeuBackground(screen: .inventory)
                .environment(theme)
        }
        .refreshable {
            await appVM.loadAll()
        }
        .alert(
            String(localized: "inventory.delete_confirm"),
            isPresented: Binding(
                get: { itemToDelete != nil },
                set: { if !$0 { itemToDelete = nil } }
            ),
            presenting: itemToDelete
        ) { item in
            Button(role: .destructive) {
                appVM.removeItem(id: item.id)
            } label: {
                Text(String(localized: "common.delete"))
            }
            Button(String(localized: "common.cancel"), role: .cancel) {}
        } message: { _ in
            Text(String(localized: "inventory.delete_confirm.message"))
        }
    }
}
