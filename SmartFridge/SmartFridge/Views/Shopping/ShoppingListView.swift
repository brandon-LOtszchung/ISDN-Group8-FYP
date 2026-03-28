// Views/Shopping/ShoppingListView.swift
import SwiftUI

struct ShoppingListView: View {
    @Environment(ShoppingViewModel.self) private var shoppingVM
    @Environment(ThemeManager.self) private var theme
    @State private var showClearConfirmation = false

    var body: some View {
        Group {
            if shoppingVM.items.isEmpty {
                ContentUnavailableView(
                    "No items",
                    systemImage: "cart",
                    description: Text("Add missing ingredients from a recipe.")
                )
            } else {
                shoppingList
            }
        }
        .navigationTitle(String(localized: "shopping.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(String(localized: "shopping.clear_bought")) {
                    showClearConfirmation = true
                }
                .disabled(shoppingVM.purchasedItemIDs.isEmpty)
                .tint(theme.colors.danger)
            }
        }
        .confirmationDialog(
            String(localized: "shopping.clear_bought_confirm.title"),
            isPresented: $showClearConfirmation,
            titleVisibility: .visible
        ) {
            Button(String(localized: "shopping.clear_bought"), role: .destructive) {
                shoppingVM.clearBought()
            }
            Button(String(localized: "common.cancel"), role: .cancel) {}
        } message: {
            Text(String(localized: "shopping.clear_bought_confirm.message"))
        }
        .topBarToolbar()
    }

    private var shoppingList: some View {
        List {
            // Total cost card
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(String(localized: "shopping.total"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("HK$\(shoppingVM.totalEstimatedCost, specifier: "%.0f")")
                            .font(.title2.bold())
                            .foregroundStyle(theme.colors.primary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: NSLocalizedString("shopping.items", comment: ""), shoppingVM.items.count))
                            .font(.caption).foregroundStyle(.secondary)
                        Text(String(format: NSLocalizedString("shopping.bought", comment: ""), shoppingVM.purchasedItemIDs.count))
                            .font(.caption).foregroundStyle(.green)
                    }
                }
                .padding(.vertical, 4)
            }

            // Items grouped by recipe
            ForEach(shoppingVM.itemsGroupedByRecipe.keys.sorted(), id: \.self) { recipe in
                Section(recipe) {
                    ForEach(shoppingVM.itemsGroupedByRecipe[recipe] ?? []) { item in
                        ShoppingItemRow(item: item) {
                            shoppingVM.togglePurchased(item)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                shoppingVM.removeItem(id: item.id)
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

// MARK: - Shopping Item Row

private struct ShoppingItemRow: View {
    let item: ShoppingListItem
    let onToggle: () -> Void
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                Image(systemName: item.isPurchased ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(item.isPurchased ? .green : theme.colors.border)
                    .font(.title3)
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .strikethrough(item.isPurchased)
                        .foregroundStyle(item.isPurchased ? .secondary : theme.colors.text)
                        .font(.body)
                    Text("\(item.quantity, specifier: "%.0f") \(item.unit)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if let cost = item.estimatedUnitCost {
                    Text("HK$\(cost, specifier: "%.0f")")
                        .font(.subheadline.bold())
                        .foregroundStyle(theme.colors.primary)
                } else {
                    Text("—")
                        .font(.subheadline.bold())
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item.name)
        .accessibilityHint(item.isPurchased
            ? String(localized: "shopping.hint.unmark")
            : String(localized: "shopping.hint.mark"))
    }
}
