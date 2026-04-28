// ViewModels/ShoppingViewModel.swift
import Foundation
import Supabase

// MARK: - Aggregated Item

struct AggregatedShoppingItem: Identifiable {
    var id: String { "\(name.lowercased())|\(unit.lowercased())" }
    var name: String
    var unit: String
    var totalQuantity: Double
    var estimatedUnitCost: Double?
    var alternatives: [String]
    /// Underlying items, one per source recipe, sorted by recipe name.
    var sources: [ShoppingListItem]

    var isPurchased: Bool { sources.allSatisfy(\.isPurchased) }
    var isPartiallyPurchased: Bool { sources.contains(where: \.isPurchased) && !isPurchased }
}

// MARK: - ViewModel

@Observable
@MainActor
final class ShoppingViewModel {
    var items: [ShoppingListItem] = []
    var familyId: UUID = UUID()
    var isLoading = false
    var error: String?

    private let supabase = SupabaseService.shared
    nonisolated(unsafe) private var realtimeChannel: RealtimeChannelV2?

    var totalEstimatedCost: Double {
        items.compactMap { item in item.estimatedUnitCost.map { $0 * item.quantity } }.reduce(0, +)
    }

    var purchasedItemIDs: [UUID] {
        items.filter(\.isPurchased).map(\.id)
    }

    var itemsGroupedByRecipe: [String: [ShoppingListItem]] {
        Dictionary(grouping: items) { $0.recipeName ?? "Other" }
    }

    /// Items merged by (name, unit) across all recipes, sorted alphabetically by name.
    var aggregatedItems: [AggregatedShoppingItem] {
        var groups: [String: [ShoppingListItem]] = [:]
        for item in items {
            let key = "\(item.name.lowercased())|\(item.unit.lowercased())"
            groups[key, default: []].append(item)
        }
        return groups.values.map { groupItems in
            let sorted = groupItems.sorted { ($0.recipeName ?? "") < ($1.recipeName ?? "") }
            return AggregatedShoppingItem(
                name: sorted[0].name,
                unit: sorted[0].unit,
                totalQuantity: sorted.reduce(0) { $0 + $1.quantity },
                estimatedUnitCost: sorted.compactMap(\.estimatedUnitCost).first,
                alternatives: Array(Set(sorted.flatMap(\.alternatives))),
                sources: sorted
            )
        }.sorted { $0.name.lowercased() < $1.name.lowercased() }
    }

    var aggregatedPurchasedCount: Int {
        aggregatedItems.filter(\.isPurchased).count
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            items = try await supabase.fetchShoppingList(familyId: familyId)
            subscribeToRealtime()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func togglePurchased(_ item: ShoppingListItem) {
        let snapshot = items
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        items[idx].isPurchased.toggle()
        let updated = items[idx]
        Task {
            do { try await supabase.updateShoppingItem(updated) }
            catch {
                items = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    /// Marks all underlying items for an aggregated entry purchased/unpurchased together.
    func toggleAggregated(_ aggregated: AggregatedShoppingItem) {
        let snapshot = items
        let newPurchased = !aggregated.isPurchased
        for source in aggregated.sources {
            guard let idx = items.firstIndex(where: { $0.id == source.id }) else { continue }
            items[idx].isPurchased = newPurchased
        }
        let updatedItems = aggregated.sources.compactMap { source -> ShoppingListItem? in
            items.first(where: { $0.id == source.id })
        }
        Task {
            do {
                for updated in updatedItems {
                    try await supabase.updateShoppingItem(updated)
                }
            } catch {
                items = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    /// Removes all underlying items for an aggregated entry.
    func removeAggregated(_ aggregated: AggregatedShoppingItem) {
        let snapshot = items
        let ids = aggregated.sources.map(\.id)
        items.removeAll { ids.contains($0.id) }
        Task {
            do { try await supabase.deleteShoppingListItems(ids: ids) }
            catch {
                items = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func removeItem(id: UUID) {
        let snapshot = items
        items.removeAll { $0.id == id }
        Task {
            do { try await supabase.deleteShoppingListItems(ids: [id]) }
            catch {
                items = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func clearBought() {
        let snapshot = items
        let ids = purchasedItemIDs
        items.removeAll { $0.isPurchased }
        Task {
            do { try await supabase.deleteShoppingListItems(ids: ids) }
            catch {
                items = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    private func subscribeToRealtime() {
        realtimeChannel = supabase.subscribeToShoppingList(
            familyId: familyId
        ) { [weak self] updated in
            Task { @MainActor [weak self] in
                self?.items = updated
            }
        }
    }

    deinit {
        Task { [realtimeChannel] in
            await realtimeChannel?.unsubscribe()
        }
    }
}
