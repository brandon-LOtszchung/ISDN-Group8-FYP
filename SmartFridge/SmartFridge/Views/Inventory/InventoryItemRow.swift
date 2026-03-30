// Views/Inventory/InventoryItemRow.swift
import SwiftUI

struct InventoryItemRow: View {
    let item: InventoryItem
    var onEdit: () -> Void = {}

    @Environment(ThemeManager.self) private var theme
    @Environment(AppViewModel.self) private var appVM

    // Maps category string to an emoji
    private var categoryEmoji: String {
        switch item.category.lowercased() {
        case let c where c.contains("protein") || c.contains("meat") || c.contains("seafood"): return "🥩"
        case let c where c.contains("vegetable"):  return "🥦"
        case let c where c.contains("fruit"):      return "🍎"
        case let c where c.contains("dairy"):      return "🥛"
        case let c where c.contains("grain"):      return "🌾"
        case let c where c.contains("condiment"):  return "🫙"
        default:                                   return "🍽️"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Text(categoryEmoji).font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name).font(.body.bold()).foregroundStyle(theme.colors.text)
                Text(item.category).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(item.quantity, specifier: "%.0f")")
                .font(.subheadline.bold())
                .foregroundStyle(theme.colors.primary)
        }
        .padding(.vertical, 4)
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            Button {
                var updated = item
                updated.quantity += 1
                appVM.updateItem(updated)
            } label: {
                Label(String(localized: "inventory.action_stock"), systemImage: "plus.circle.fill")
            }
            .tint(Color(red: 0.204, green: 0.780, blue: 0.349))
            .buttonRepeatBehavior(.enabled)

            Button {
                guard item.quantity > 0 else { return }
                var updated = item
                updated.quantity = max(0, updated.quantity - 1)
                appVM.updateItem(updated)
            } label: {
                Label(String(localized: "inventory.action_use"), systemImage: "minus.circle.fill")
            }
            .tint(Color(red: 1.0, green: 0.584, blue: 0.0))
            .disabled(item.quantity <= 0)
            .buttonRepeatBehavior(.enabled)

            Button { onEdit() } label: {
                Label(String(localized: "inventory.action_edit"), systemImage: "pencil")
            }
            .tint(Color(red: 0.0, green: 0.478, blue: 1.0))
        }
    }
}
