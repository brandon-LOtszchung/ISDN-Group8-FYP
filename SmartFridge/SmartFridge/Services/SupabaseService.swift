// Services/SupabaseService.swift
import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        guard let url = URL(string: Config.supabaseURL) else {
            preconditionFailure("SUPABASE_URL is not a valid URL: \(Config.supabaseURL)")
        }
        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: Config.supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
#if DEBUG
        print("[Supabase] Client initialised — URL: \(Config.supabaseURL)")
#endif
    }

    // MARK: - Auth

    func sendPhoneOTP(phone: String) async throws {
#if DEBUG
        print("[Auth] → sendPhoneOTP phone=\(phone)")
#endif
        try await client.auth.signInWithOTP(phone: phone)
#if DEBUG
        print("[Auth] ✓ OTP sent")
#endif
    }

    @discardableResult
    func verifyPhoneOTP(phone: String, token: String) async throws -> AuthResponse {
#if DEBUG
        print("[Auth] → verifyPhoneOTP phone=\(phone) token=\(token)")
#endif
        let response = try await client.auth.verifyOTP(phone: phone, token: token, type: .sms)
#if DEBUG
        print("[Auth] ✓ Verified — userId=\(response.user.id)")
#endif
        return response
    }

    func signOut() async throws {
#if DEBUG
        print("[Auth] → signOut userId=\(currentUserId?.uuidString ?? "nil")")
#endif
        try await client.auth.signOut()
#if DEBUG
        print("[Auth] ✓ Signed out")
#endif
    }

    func deleteUserAccount() async throws {
        try await client.rpc("delete_user_account").execute()
        try await client.auth.signOut()
    }

    var currentUserId: UUID? {
        client.auth.currentUser?.id
    }

    /// Synchronous access token from the cached session, for attaching auth
    /// headers in non-async contexts. Returns nil when there is no active session.
    var currentAccessToken: String? {
        client.auth.currentSession?.accessToken
    }

    func freshAccessToken() async throws -> String {
        let token = try await client.auth.session.accessToken
#if DEBUG
        print("[Auth] freshAccessToken — prefix: \(String(token.prefix(20)))…")
#endif
        return token
    }

    // MARK: - Family

    func fetchFamily(id: UUID) async throws -> Family? {
#if DEBUG
        print("[Supabase] → fetchFamily id=\(id)")
#endif
        let families: [Family] = try await client
            .from("families")
            .select()
            .eq("id", value: id)
            .limit(1)
            .execute()
            .value
#if DEBUG
        if let f = families.first {
            print("[Supabase] ← fetchFamily → found '\(f.name)'")
        } else {
            print("[Supabase] ← fetchFamily → nil")
        }
#endif
        return families.first
    }

    func fetchFamilyForUser(userId: UUID) async throws -> Family? {
#if DEBUG
        print("[Supabase] → fetchFamilyForUser userId=\(userId)")
#endif
        let families: [Family] = try await client
            .from("families")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
#if DEBUG
        if let f = families.first {
            print("[Supabase] ← fetchFamilyForUser → familyId=\(f.id) name='\(f.name)'")
        } else {
            print("[Supabase] ← fetchFamilyForUser → nil (no family for this user)")
        }
#endif
        return families.first
    }

    func upsertFamilyWithUser(_ family: Family, userId: UUID) async throws {
#if DEBUG
        print("[Supabase] → upsertFamily id=\(family.id) name='\(family.name)' userId=\(userId)")
#endif
        var updated = family
        updated.userId = userId
        try await client
            .from("families")
            .upsert(updated, onConflict: "id")
            .execute()
#if DEBUG
        print("[Supabase] ✓ upsertFamily done")
#endif
    }

    // MARK: - Family Members

    func fetchMembers(familyId: UUID) async throws -> [FamilyMember] {
#if DEBUG
        print("[Supabase] → fetchMembers familyId=\(familyId)")
#endif
        let members: [FamilyMember] = try await client
            .from("family_members")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
#if DEBUG
        print("[Supabase] ← fetchMembers → \(members.count) member(s): \(members.map(\.name).joined(separator: ", "))")
#endif
        return members
    }

    func upsertMember(_ member: FamilyMember) async throws {
#if DEBUG
        print("[Supabase] → upsertMember id=\(member.id) name='\(member.name)'")
#endif
        try await client
            .from("family_members")
            .upsert(member, onConflict: "id")
            .execute()
#if DEBUG
        print("[Supabase] ✓ upsertMember done")
#endif
    }

    func deleteMember(id: UUID) async throws {
#if DEBUG
        print("[Supabase] → deleteMember id=\(id)")
#endif
        try await client
            .from("family_members")
            .delete()
            .eq("id", value: id)
            .execute()
#if DEBUG
        print("[Supabase] ✓ deleteMember done")
#endif
    }

    func upsertMembers(_ members: [FamilyMember]) async throws {
        guard !members.isEmpty else { return }
#if DEBUG
        print("[Supabase] → upsertMembers count=\(members.count) names=\(members.map(\.name).joined(separator: ", "))")
#endif
        try await client
            .from("family_members")
            .upsert(members, onConflict: "id")
            .execute()
#if DEBUG
        print("[Supabase] ✓ upsertMembers done")
#endif
    }

    // MARK: - Inventory

    func fetchInventory(familyId: UUID) async throws -> [InventoryItem] {
#if DEBUG
        print("[Supabase] → fetchInventory familyId=\(familyId)")
#endif
        let items: [InventoryItem] = try await client
            .from("inventory_items")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
#if DEBUG
        let preview = items.prefix(5).map(\.name).joined(separator: ", ")
        print("[Supabase] ← fetchInventory → \(items.count) item(s): \(preview)\(items.count > 5 ? "…" : "")")
#endif
        return items
    }

    func addItem(_ item: InventoryItem) async throws {
#if DEBUG
        print("[Supabase] → addItem id=\(item.id) name='\(item.name)' category=\(item.category) qty=\(item.quantity)")
#endif
        try await client
            .from("inventory_items")
            .insert(item)
            .execute()
#if DEBUG
        print("[Supabase] ✓ addItem done — '\(item.name)'")
#endif
    }

    func updateItem(_ item: InventoryItem) async throws {
#if DEBUG
        print("[Supabase] → updateItem id=\(item.id) name='\(item.name)' qty=\(item.quantity)")
#endif
        try await client
            .from("inventory_items")
            .update(item)
            .eq("id", value: item.id)
            .execute()
#if DEBUG
        print("[Supabase] ✓ updateItem done")
#endif
    }

    func deleteItem(id: UUID) async throws {
#if DEBUG
        print("[Supabase] → deleteItem id=\(id)")
#endif
        try await client
            .from("inventory_items")
            .delete()
            .eq("id", value: id)
            .execute()
#if DEBUG
        print("[Supabase] ✓ deleteItem done")
#endif
    }

    // MARK: - Shopping List

    func fetchShoppingList(familyId: UUID) async throws -> [ShoppingListItem] {
#if DEBUG
        print("[Supabase] → fetchShoppingList familyId=\(familyId)")
#endif
        let items: [ShoppingListItem] = try await client
            .from("shopping_list_items")
            .select()
            .eq("family_id", value: familyId)
            .execute()
            .value
#if DEBUG
        let preview = items.prefix(5).map(\.name).joined(separator: ", ")
        print("[Supabase] ← fetchShoppingList → \(items.count) item(s): \(preview)\(items.count > 5 ? "…" : "")")
#endif
        return items
    }

    func addShoppingItems(_ items: [ShoppingListItem]) async throws {
#if DEBUG
        print("[Supabase] → addShoppingItems count=\(items.count) names=\(items.map(\.name).joined(separator: ", "))")
#endif
        try await client
            .from("shopping_list_items")
            .insert(items)
            .execute()
#if DEBUG
        print("[Supabase] ✓ addShoppingItems done")
#endif
    }

    func updateShoppingItem(_ item: ShoppingListItem) async throws {
#if DEBUG
        print("[Supabase] → updateShoppingItem id=\(item.id) name='\(item.name)' isPurchased=\(item.isPurchased)")
#endif
        try await client
            .from("shopping_list_items")
            .update(item)
            .eq("id", value: item.id)
            .execute()
#if DEBUG
        print("[Supabase] ✓ updateShoppingItem done")
#endif
    }

    func deleteShoppingListItems(ids: [UUID]) async throws {
        guard !ids.isEmpty else { return }
#if DEBUG
        print("[Supabase] → deleteShoppingListItems count=\(ids.count)")
#endif
        try await client
            .from("shopping_list_items")
            .delete()
            .in("id", values: ids.map(\.uuidString))
            .execute()
#if DEBUG
        print("[Supabase] ✓ deleteShoppingListItems done")
#endif
    }

    // MARK: - Realtime

    func subscribeToMembers(
        familyId: UUID,
        onChange: @escaping @Sendable ([FamilyMember]) -> Void
    ) async -> RealtimeChannelV2 {
#if DEBUG
        print("[Realtime] → subscribeToMembers familyId=\(familyId)")
#endif
        let channel = client.realtimeV2.channel("family_members:\(familyId)")
        _ = channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "family_members",
            filter: "family_id=eq.\(familyId.uuidString.lowercased())"
        ) { [weak self] _ in
            guard let self else { return }
#if DEBUG
            print("[Realtime] members change event — re-fetching")
#endif
            Task {
                do {
                    let updated = try await self.fetchMembers(familyId: familyId)
                    onChange(updated)
                } catch {
                    print("[Realtime] members re-fetch failed: \(error)")
                }
            }
        }
        do {
            try await channel.subscribeWithError()
#if DEBUG
            print("[Realtime] ✓ subscribed to members channel")
#endif
        } catch {
            print("[SupabaseService] Realtime subscription failed (members): \(error)")
        }
        return channel
    }

    func subscribeToInventory(
        familyId: UUID,
        onChange: @escaping @Sendable ([InventoryItem]) -> Void
    ) async -> RealtimeChannelV2 {
#if DEBUG
        print("[Realtime] → subscribeToInventory familyId=\(familyId)")
#endif
        let channel = client.realtimeV2.channel("inventory_items:\(familyId)")
        _ = channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "inventory_items",
            filter: "family_id=eq.\(familyId.uuidString.lowercased())"
        ) { [weak self] action in
            guard let self else { return }
#if DEBUG
            switch action {
            case .insert(let a):
                let name = a.record["name"]?.stringValue ?? "?"
                print("[Realtime] inventory INSERT — name='\(name)'")
            case .update(let a):
                let name = a.record["name"]?.stringValue ?? "?"
                let qty  = a.record["quantity"]?.stringValue ?? "?"
                print("[Realtime] inventory UPDATE — name='\(name)' qty=\(qty)")
            case .delete(let a):
                let name = a.oldRecord["name"]?.stringValue ?? "?"
                print("[Realtime] inventory DELETE — name='\(name)'")
            default:
                print("[Realtime] inventory change event (other)")
            }
#endif
            Task {
                do {
                    let updated = try await self.fetchInventory(familyId: familyId)
                    onChange(updated)
                } catch {
                    print("[Realtime] inventory re-fetch failed: \(error)")
                }
            }
        }
        do {
            try await channel.subscribeWithError()
#if DEBUG
            print("[Realtime] ✓ subscribed to inventory channel")
#endif
        } catch {
            print("[SupabaseService] Realtime subscription failed (inventory): \(error)")
        }
        return channel
    }

    func subscribeToShoppingList(
        familyId: UUID,
        onChange: @escaping @Sendable ([ShoppingListItem]) -> Void
    ) async -> RealtimeChannelV2 {
#if DEBUG
        print("[Realtime] → subscribeToShoppingList familyId=\(familyId)")
#endif
        let channel = client.realtimeV2.channel("shopping_list_items:\(familyId)")
        _ = channel.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "shopping_list_items",
            filter: "family_id=eq.\(familyId.uuidString.lowercased())"
        ) { [weak self] _ in
            guard let self else { return }
#if DEBUG
            print("[Realtime] shopping_list change event — re-fetching")
#endif
            Task {
                do {
                    let updated = try await self.fetchShoppingList(familyId: familyId)
                    onChange(updated)
                } catch {
                    print("[Realtime] shopping_list re-fetch failed: \(error)")
                }
            }
        }
        do {
            try await channel.subscribeWithError()
#if DEBUG
            print("[Realtime] ✓ subscribed to shopping_list channel")
#endif
        } catch {
            print("[SupabaseService] Realtime subscription failed (shopping_list): \(error)")
        }
        return channel
    }

    // MARK: - Saved Recipes

    func fetchSavedRecipes(familyId: UUID) async throws -> [SavedRecipe] {
#if DEBUG
        print("[Supabase] → fetchSavedRecipes familyId=\(familyId)")
#endif
        let recipes: [SavedRecipe] = try await client
            .from("saved_recipes")
            .select()
            .eq("family_id", value: familyId)
            .order("created_at", ascending: false)
            .execute()
            .value
#if DEBUG
        print("[Supabase] ← fetchSavedRecipes → \(recipes.count) recipe(s)")
#endif
        return recipes
    }

    func toggleFavorite(recipeId: UUID, isFavorite: Bool) async throws {
#if DEBUG
        print("[Supabase] → toggleFavorite recipeId=\(recipeId) isFavorite=\(isFavorite)")
#endif
        try await client
            .from("saved_recipes")
            .update(["is_favorite": isFavorite])
            .eq("id", value: recipeId)
            .execute()
#if DEBUG
        print("[Supabase] ✓ toggleFavorite done")
#endif
    }
}
