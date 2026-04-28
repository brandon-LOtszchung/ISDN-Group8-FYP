// Views/Inventory/InventoryItemFormView.swift
import SwiftUI

struct InventoryItemFormView: View {
    let item: InventoryItem?

    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var selectedCategory: String = ""
    @State private var quantity: Int = 1

    private var isSaveDisabled: Bool {
        name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(String(localized: "inventory.item_name"), text: $name)
                }

                Section {
                    Picker(String(localized: "inventory.item_category"), selection: $selectedCategory) {
                        ForEach(Constants.inventoryCategories, id: \.self) { category in
                            Text(category).tag(category)
                        }
                    }
                }

                Section {
                    Stepper(value: $quantity, in: 0...9999) {
                        HStack {
                            Text(String(localized: "inventory.item_quantity"))
                            Spacer()
                            Text("\(quantity)")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(theme.colors.background)
            .navigationTitle(item == nil
                ? String(localized: "inventory.add_item")
                : String(localized: "inventory.edit_item"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "common.save")) { save() }
                        .disabled(isSaveDisabled)
                }
            }
            .onAppear { configure() }
        }
    }

    private func configure() {
        if let item {
            name = item.name
            selectedCategory = Constants.inventoryCategories.contains(item.category)
                ? item.category
                : (Constants.inventoryCategories.last ?? "Other")
            quantity = Int(item.quantity)
        } else {
            selectedCategory = Constants.inventoryCategories.first ?? ""
            quantity = 1
        }
    }

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let category = selectedCategory

        if let existing = item {
            var updated = existing
            updated.name = trimmedName
            updated.category = category
            updated.quantity = Double(quantity)
            appVM.updateItem(updated)
        } else {
            let newItem = InventoryItem(
                id: UUID(),
                familyId: appVM.familyId ?? UUID(),
                name: trimmedName,
                category: category,
                quantity: Double(quantity)
            )
            appVM.addItem(newItem)
        }
        dismiss()
    }
}
