// ViewModels/AppViewModel.swift
import Foundation
import Supabase

@Observable
@MainActor
final class AppViewModel {
    var family: Family?
    var members: [FamilyMember] = []
    var inventory: [InventoryItem] = []
    var familyId: UUID?
    var fridgeInitialized: Bool {
        didSet { UserDefaults.standard.set(fridgeInitialized, forKey: Constants.StorageKeys.fridgeInitialized) }
    }
    var isLoading = false
    var isOffline = false
    var error: String?
    var hasCompletedOnboarding: Bool {
        didSet { UserDefaults.standard.set(hasCompletedOnboarding, forKey: Constants.StorageKeys.hasCompletedOnboarding) }
    }

    var currentUserId: UUID? { supabase.currentUserId }
    var isAuthResolved = false

    private let supabase = SupabaseService.shared
    nonisolated(unsafe) private var membersChannel: RealtimeChannelV2?
    nonisolated(unsafe) private var inventoryChannel: RealtimeChannelV2?
    private var subscribedFamilyId: UUID?

    init() {
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: Constants.StorageKeys.hasCompletedOnboarding)
        self.fridgeInitialized = UserDefaults.standard.bool(forKey: Constants.StorageKeys.fridgeInitialized)
    }

    // MARK: - Onboarding

    func completeOnboarding() {
        hasCompletedOnboarding = true
    }

    // MARK: - Auth state listener

    func listenForAuthChanges() async {
        for await (_, session) in supabase.client.auth.authStateChanges {
            if session != nil {
                await loadAll()
            } else {
                unsubscribeRealtime()
                family = nil
                members = []
                inventory = []
                familyId = nil
            }
            isAuthResolved = true
        }
    }

    func signOut() {
        Task {
            try? await supabase.signOut()
        }
    }

    // MARK: - Local (optimistic) inventory mutations

    func addLocalItem(_ item: InventoryItem) {
        inventory.append(item)
    }

    func removeLocalItem(id: UUID) {
        inventory.removeAll { $0.id == id }
    }

    func updateLocalItem(_ item: InventoryItem) {
        if let idx = inventory.firstIndex(where: { $0.id == item.id }) {
            inventory[idx] = item
        }
    }

    // MARK: - Remote load

    func loadAll() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = supabase.currentUserId else { return }

        do {
            guard let fetchedFamily = try await supabase.fetchFamilyForUser(userId: userId) else {
                family = nil
                members = []
                inventory = []
                familyId = nil
                isOffline = false
                return
            }
            family = fetchedFamily
            familyId = fetchedFamily.id

            async let m = supabase.fetchMembers(familyId: fetchedFamily.id)
            async let i = supabase.fetchInventory(familyId: fetchedFamily.id)
            members   = try await m
            inventory = try await i
            isOffline = false
            subscribeRealtime(familyId: fetchedFamily.id)
        } catch {
            isOffline = true
            self.error = error.localizedDescription
        }
    }

    // MARK: - Remote writes (optimistic with rollback)

    func addItem(_ item: InventoryItem) {
        let snapshot = inventory
        addLocalItem(item)
        Task {
            do { try await supabase.addItem(item) }
            catch {
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func removeItem(id: UUID) {
        let snapshot = inventory
        removeLocalItem(id: id)
        Task {
            do { try await supabase.deleteItem(id: id) }
            catch {
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func updateItem(_ item: InventoryItem) {
        let snapshot = inventory
        updateLocalItem(item)
        Task {
            do { try await supabase.updateItem(item) }
            catch {
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func addMember(_ member: FamilyMember) {
        let snapshot = members
        members.append(member)
        Task {
            do { try await supabase.upsertMember(member) }
            catch {
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func deleteMember(id: UUID) {
        let snapshot = members
        members.removeAll { $0.id == id }
        Task {
            do { try await supabase.deleteMember(id: id) }
            catch {
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func updateMember(_ member: FamilyMember) {
        let snapshot = members
        if let idx = members.firstIndex(where: { $0.id == member.id }) {
            members[idx] = member
        }
        Task {
            do { try await supabase.upsertMember(member) }
            catch {
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func saveFamily(_ f: Family, members m: [FamilyMember]) {
        family  = f
        members = m
        familyId = f.id
        Task {
            do {
                if let userId = supabase.currentUserId {
                    try await supabase.upsertFamilyWithUser(f, userId: userId)
                } else {
                    try await supabase.upsertFamily(f)
                }
                for member in m { try await supabase.upsertMember(member) }
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    func saveFamilyAsync(_ f: Family, members m: [FamilyMember]) async throws {
        if let userId = supabase.currentUserId {
            try await supabase.upsertFamilyWithUser(f, userId: userId)
        } else {
            try await supabase.upsertFamily(f)
        }
        for member in m { try await supabase.upsertMember(member) }
        family = f
        self.members = m
        familyId = f.id
    }

    // MARK: - Realtime

    private func subscribeRealtime(familyId: UUID) {
        // Auth state can fire multiple times for the same session (token refresh, etc.).
        // Guard here so we never create duplicate channels with the same name — the SDK
        // silently drops the second subscription when names collide.
        guard subscribedFamilyId != familyId else { return }
        subscribedFamilyId = familyId

        let old = (membersChannel, inventoryChannel)
        membersChannel = nil
        inventoryChannel = nil

        // Await old-channel teardown before creating new ones so the SDK never sees
        // two live channels with the same name simultaneously.
        Task {
            await old.0?.unsubscribe()
            await old.1?.unsubscribe()
            self.membersChannel = self.supabase.subscribeToMembers(familyId: familyId) { [weak self] updated in
                Task { @MainActor [weak self] in self?.members = updated }
            }
            self.inventoryChannel = self.supabase.subscribeToInventory(familyId: familyId) { [weak self] updated in
                Task { @MainActor [weak self] in self?.inventory = updated }
            }
        }
    }

    private func unsubscribeRealtime() {
        subscribedFamilyId = nil
        let m = membersChannel
        let i = inventoryChannel
        membersChannel = nil
        inventoryChannel = nil
        Task {
            await m?.unsubscribe()
            await i?.unsubscribe()
        }
    }

    deinit {
        Task { [membersChannel, inventoryChannel] in
            await membersChannel?.unsubscribe()
            await inventoryChannel?.unsubscribe()
        }
    }
}
