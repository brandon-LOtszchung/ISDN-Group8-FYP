// Services/SupabaseService.swift
import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
    }

    // MARK: - Auth

    func sendPhoneOTP(phone: String) async throws {
        try await client.auth.signInWithOTP(phone: phone)
    }

    @discardableResult
    func verifyPhoneOTP(phone: String, token: String) async throws -> AuthResponse {
        try await client.auth.verifyOTP(phone: phone, token: token, type: .sms)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    var currentUserId: UUID? {
        client.auth.currentUser?.id
    }

    var currentAccessToken: String? {
        client.auth.currentSession?.accessToken
    }

    // MARK: - Family

    func fetchFamily(id: UUID) async throws -> Family? {
        let families: [Family] = try await client
            .from("families")
            .select()
            .eq("id", value: id)
            .limit(1)
            .execute()
            .value
        return families.first
    }

    func fetchFamilyForUser(userId: UUID) async throws -> Family? {
        let families: [Family] = try await client
            .from("families")
            .select()
            .eq("user_id", value: userId)
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

    func upsertFamilyWithUser(_ family: Family, userId: UUID) async throws {
        // family must already have user_id set
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

    func subscribeToMembers(
        familyId: UUID,
        onChange: @escaping @Sendable ([FamilyMember]) -> Void
    ) -> RealtimeChannelV2 {
        let channel = client.realtimeV2.channel("family_members:\(familyId)")
        channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "family_members",
            filter: "family_id=eq.\(familyId)"
        ) { [weak self] _ in
            guard let self else { return }
            Task {
                do {
                    let updated = try await self.fetchMembers(familyId: familyId)
                    onChange(updated)
                } catch {
                    print("[Realtime] members re-fetch failed: \(error)")
                }
            }
        }
        Task { await channel.subscribe() }
        return channel
    }

    func subscribeToInventory(
        familyId: UUID,
        onChange: @escaping @Sendable ([InventoryItem]) -> Void
    ) -> RealtimeChannelV2 {
        let channel = client.realtimeV2.channel("inventory_items:\(familyId)")
        channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "inventory_items",
            filter: "family_id=eq.\(familyId)"
        ) { [weak self] _ in
            guard let self else { return }
            Task {
                do {
                    let updated = try await self.fetchInventory(familyId: familyId)
                    onChange(updated)
                } catch {
                    print("[Realtime] inventory re-fetch failed: \(error)")
                }
            }
        }
        Task { await channel.subscribe() }
        return channel
    }

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
