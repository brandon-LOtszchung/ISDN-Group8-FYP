// Views/Shopping/ShoppingListView.swift
import SwiftUI

struct ShoppingListView: View {
    @Environment(ShoppingViewModel.self) private var shoppingVM
    @Environment(ThemeManager.self) private var theme
    @State private var showClearConfirmation = false

    fileprivate static let hkdFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "HKD"
        f.maximumFractionDigits = 0
        return f
    }()

    private var shareText: String {
        var lines: [String] = []
        lines.append(String(localized: "shopping.title"))
        if let total = Self.hkdFormatter.string(from: NSNumber(value: shoppingVM.totalEstimatedCost)) {
            lines.append("\(String(localized: "shopping.total")): \(total)")
        }
        lines.append("")
        for item in shoppingVM.aggregatedItems {
            let status = item.isPurchased ? "✓" : (item.isPartiallyPurchased ? "◑" : "○")
            var row = "\(status) \(item.name) – \(Int(item.totalQuantity)) \(item.unit)"
            if let cost = item.estimatedUnitCost,
               let formatted = Self.hkdFormatter.string(from: NSNumber(value: cost)) {
                row += " (\(formatted)/\(item.unit))"
            }
            lines.append(row)
            for source in item.sources {
                lines.append("   · \(source.recipeName ?? String(localized: "shopping.source.other")): \(Int(source.quantity)) \(source.unit)")
            }
        }
        return lines.joined(separator: "\n").trimmingCharacters(in: .newlines)
    }

    var body: some View {
        Group {
            if shoppingVM.items.isEmpty {
                ContentUnavailableView(
                    String(localized: "shopping.empty"),
                    systemImage: "cart",
                    description: Text(String(localized: "shopping.empty.description"))
                )
            } else {
                shoppingList
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background {
            NeuBackground(screen: .shopping)
                .environment(theme)
        }
        .navigationTitle(String(localized: "shopping.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: shareText) {
                    Label(String(localized: "shopping.share"), systemImage: "square.and.arrow.up")
                }
                .disabled(shoppingVM.items.isEmpty)
            }
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
        .alert(String(localized: "common.error"), isPresented: Binding(
            get: { shoppingVM.error != nil },
            set: { if !$0 { shoppingVM.error = nil } }
        )) {
            Button(String(localized: "common.done")) { shoppingVM.error = nil }
        } message: { Text(shoppingVM.error ?? "") }
    }

    private var shoppingList: some View {
        List {
            // Total cost card
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(String(localized: "shopping.total"))
                            .font(.sgCaption())
                            .foregroundStyle(.secondary)
                        Text(ShoppingListView.hkdFormatter.string(from: NSNumber(value: shoppingVM.totalEstimatedCost)) ?? "")
                            .font(.spaceGrotesk(.bold, size: 22))
                            .foregroundStyle(theme.colors.primary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: String(localized: "shopping.items"), shoppingVM.aggregatedItems.count))
                            .font(.sgCaption()).foregroundStyle(.secondary)
                        Text(String(format: String(localized: "shopping.bought"), shoppingVM.aggregatedPurchasedCount))
                            .font(.sgCaption()).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            // Aggregated ingredient list
            Section {
                ForEach(shoppingVM.aggregatedItems) { item in
                    AggregatedItemRow(item: item) {
                        shoppingVM.toggleAggregated(item)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            shoppingVM.removeAggregated(item)
                        } label: {
                            Label(String(localized: "common.delete"), systemImage: "trash")
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background {
            NeuBackground(screen: .shopping)
                .environment(theme)
        }
    }
}

// MARK: - Aggregated Item Row

private struct AggregatedItemRow: View {
    let item: AggregatedShoppingItem
    let onToggle: () -> Void
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                Image(systemName: checkIconName)
                    .foregroundStyle(checkIconColor)
                    .font(.title3)

                Text(IngredientEmoji.emoji(for: item.name))
                    .font(.system(size: 20))
                    .frame(width: 36, height: 36)
                    .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 8))
                    .opacity(item.isPurchased ? 0.4 : 1.0)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .strikethrough(item.isPurchased)
                        .foregroundStyle(item.isPurchased ? .secondary : theme.colors.text)
                        .font(.sgBody())
                    Text("\(item.totalQuantity, specifier: "%.0f") \(item.unit)")
                        .font(.sgCaption())
                        .foregroundStyle(.secondary)
                    // Source recipes
                    ForEach(item.sources) { source in
                        Text("· \(source.recipeName ?? String(localized: "shopping.source.other"))  \(source.quantity, specifier: "%.0f") \(source.unit)")
                            .font(.caption2)
                            .foregroundStyle(theme.colors.textMuted)
                    }
                }

                Spacer()

                if let cost = item.estimatedUnitCost {
                    Text(ShoppingListView.hkdFormatter.string(from: NSNumber(value: cost)) ?? "—")
                        .font(.spaceGrotesk(.semibold, size: 15))
                        .foregroundStyle(item.isPurchased ? .secondary : theme.colors.primary)
                } else {
                    Text("—")
                        .font(.spaceGrotesk(.semibold, size: 15))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.22), value: item.isPurchased)
        .accessibilityLabel(item.name)
        .accessibilityValue(accessibilityValue)
        .accessibilityHint(item.isPurchased
            ? String(localized: "shopping.hint.unmark")
            : String(localized: "shopping.hint.mark"))
    }

    private var checkIconName: String {
        if item.isPurchased { return "checkmark.circle.fill" }
        if item.isPartiallyPurchased { return "minus.circle" }
        return "circle"
    }

    private var checkIconColor: Color {
        if item.isPurchased { return theme.colors.success }
        if item.isPartiallyPurchased { return .orange }
        return theme.colors.border
    }

    private var accessibilityValue: String {
        if item.isPurchased { return String(localized: "shopping.status.purchased") }
        if item.isPartiallyPurchased { return String(localized: "shopping.status.partial") }
        return String(localized: "shopping.status.none")
    }
}
