// Views/Inventory/InventoryItemRow.swift
import SwiftUI

struct InventoryItemRow: View {
    let item: InventoryItem
    @Environment(ThemeManager.self) private var theme

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
    }
}
