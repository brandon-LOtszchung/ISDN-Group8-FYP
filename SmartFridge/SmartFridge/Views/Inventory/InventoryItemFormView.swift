// Views/Inventory/InventoryItemFormView.swift
import SwiftUI

struct InventoryItemFormView: View {
    let item: InventoryItem?

    @Environment(AppViewModel.self) private var appVM
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var selectedCategory: String = ""
    @State private var customCategory: String = ""
    @State private var quantity: Int = 1

    private var customOption: String { String(localized: "inventory.category_custom") }

    private var isCustomCategorySelected: Bool {
        selectedCategory == customOption
    }

    private var isSaveDisabled: Bool {
        name.trimmingCharacters(in: .whitespaces).isEmpty ||
        (isCustomCategorySelected && customCategory.trimmingCharacters(in: .whitespaces).isEmpty)
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
                        Text(customOption).tag(customOption)
                    }

                    if isCustomCategorySelected {
                        TextField(String(localized: "inventory.item_category"), text: $customCategory)
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
            let isKnown = Constants.inventoryCategories.contains(item.category)
            if isKnown {
                selectedCategory = item.category
            } else {
                selectedCategory = customOption
                customCategory = item.category
            }
            quantity = Int(item.quantity)
        } else {
            selectedCategory = Constants.inventoryCategories.first ?? ""
            quantity = 1
        }
    }

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let category = isCustomCategorySelected
            ? customCategory.trimmingCharacters(in: .whitespaces)
            : selectedCategory

        if let existing = item {
            var updated = existing
            updated.name = trimmedName
            updated.category = category
            updated.quantity = Double(quantity)
            appVM.updateItem(updated)
        } else {
            let newItem = InventoryItem(
                id: UUID(),
                name: trimmedName,
                category: category,
                quantity: Double(quantity)
            )
            appVM.addItem(newItem)
        }
        dismiss()
    }
}
