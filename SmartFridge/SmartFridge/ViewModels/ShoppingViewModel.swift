// ViewModels/ShoppingViewModel.swift
import Foundation
import Supabase

@Observable
@MainActor
final class ShoppingViewModel {
    var items: [ShoppingListItem] = []
    var isLoading = false
    var error: String?

    private let supabase = SupabaseService.shared
    private var realtimeChannel: RealtimeChannelV2?

    var totalEstimatedCost: Double {
        items.compactMap { item in item.estimatedUnitCost.map { $0 * item.quantity } }.reduce(0, +)
    }

    var purchasedItemIDs: [UUID] {
        items.filter(\.isPurchased).map(\.id)
    }

    var itemsGroupedByRecipe: [String: [ShoppingListItem]] {
        Dictionary(grouping: items) { $0.recipeName ?? "Other" }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            items = try await supabase.fetchShoppingList(familyId: Constants.defaultFamilyID)
            subscribeToRealtime()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func togglePurchased(_ item: ShoppingListItem) {
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        items[idx].isPurchased.toggle()
        let updated = items[idx]
        Task {
            do { try await supabase.updateShoppingItem(updated) }
            catch { self.error = error.localizedDescription }
        }
    }

    func clearBought() {
        let ids = purchasedItemIDs
        items.removeAll { $0.isPurchased }
        Task {
            do { try await supabase.deleteShoppingListItems(ids: ids) }
            catch { self.error = error.localizedDescription }
        }
    }

    private func subscribeToRealtime() {
        realtimeChannel = supabase.subscribeToShoppingList(
            familyId: Constants.defaultFamilyID
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
