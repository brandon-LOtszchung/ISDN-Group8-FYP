// Services/SupabaseService.swift
import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    private let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
    }

    // MARK: - Family

    func fetchFamily() async throws -> Family? {
        let families: [Family] = try await client
            .from("families")
            .select()
            .eq("id", value: Constants.defaultFamilyID)
            .limit(1)
            .execute()
            .value
        return families.first
    }

    func upsertFamily(_ family: Family) async throws {
        try await client
            .from("families")
            .upsert(family, onConflict: "id")
            .execute()
    }

    // MARK: - Family Members

    func fetchMembers(familyId: UUID) async throws -> [FamilyMember] {
        try await client
            .from("family_members")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
    }

    func upsertMember(_ member: FamilyMember) async throws {
        try await client
            .from("family_members")
            .upsert(member, onConflict: "id")
            .execute()
    }

    func deleteMember(id: UUID) async throws {
        try await client
            .from("family_members")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Inventory

    func fetchInventory(familyId: UUID) async throws -> [InventoryItem] {
        try await client
            .from("inventory_items")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
    }

    func addItem(_ item: InventoryItem) async throws {
        try await client
            .from("inventory_items")
            .insert(item)
            .execute()
    }

    func updateItem(_ item: InventoryItem) async throws {
        try await client
            .from("inventory_items")
            .update(item)
            .eq("id", value: item.id)
            .execute()
    }

    func deleteItem(id: UUID) async throws {
        try await client
            .from("inventory_items")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Shopping List

    func fetchShoppingList(familyId: UUID) async throws -> [ShoppingListItem] {
        try await client
            .from("shopping_list_items")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
    }

    func addShoppingItems(_ items: [ShoppingListItem]) async throws {
        try await client
            .from("shopping_list_items")
            .insert(items)
            .execute()
    }

    func updateShoppingItem(_ item: ShoppingListItem) async throws {
        try await client
            .from("shopping_list_items")
            .update(item)
            .eq("id", value: item.id)
            .execute()
    }

    /// Deletes specific items by ID — used by "Clear Bought".
    func deleteShoppingListItems(ids: [UUID]) async throws {
        guard !ids.isEmpty else { return }
        try await client
            .from("shopping_list_items")
            .delete()
            .in("id", values: ids.map(\.uuidString))
            .execute()
    }

    // MARK: - Realtime

    func subscribeToShoppingList(
        familyId: UUID,
        onChange: @escaping @Sendable ([ShoppingListItem]) -> Void
    ) -> RealtimeChannelV2 {
        let channel = client.realtimeV2.channel("shopping_list_items:\(familyId)")
        channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "shopping_list_items",
            filter: "family_id=eq.\(familyId)"
        ) { [weak self] _ in
            guard let self else { return }
            Task {
                if let updated = try? await self.fetchShoppingList(familyId: familyId) {
                    onChange(updated)
                }
            }
        }
        Task { await channel.subscribe() }
        return channel
    }
}
