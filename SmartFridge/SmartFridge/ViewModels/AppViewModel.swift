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
    var pairedCameraId: String? {
        didSet { UserDefaults.standard.set(pairedCameraId, forKey: Constants.StorageKeys.pairedCameraId) }
    }
    var isLoading = false
    var isOffline = false
    var error: String?
    var hasCompletedOnboarding: Bool {
        didSet { UserDefaults.standard.set(hasCompletedOnboarding, forKey: Constants.StorageKeys.hasCompletedOnboarding) }
    }

    var currentUserId: UUID? { supabase.currentUserId }
    var isAuthResolved = false
    var hasPairedCamera: Bool { pairedCameraId != nil }

    private let supabase = SupabaseService.shared
    private var membersChannel: RealtimeChannelV2?
    private var inventoryChannel: RealtimeChannelV2?
    private var subscribedFamilyId: UUID?
    private var realtimeTask: Task<Void, Never>?

    init() {
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: Constants.StorageKeys.hasCompletedOnboarding)
        self.fridgeInitialized = UserDefaults.standard.bool(forKey: Constants.StorageKeys.fridgeInitialized)
        self.pairedCameraId = UserDefaults.standard.string(forKey: Constants.StorageKeys.pairedCameraId)
#if DEBUG
        print("[AppVM] init — hasCompletedOnboarding=\(hasCompletedOnboarding) fridgeInitialized=\(fridgeInitialized)")
        print("[AppVM] init — pairedCameraId=\(pairedCameraId ?? "nil")")
#endif
    }

    // MARK: - Onboarding

    func completeOnboarding() {
#if DEBUG
        print("[AppVM] completeOnboarding")
#endif
        hasCompletedOnboarding = true
    }

    // MARK: - Camera Pairing

    func pairCamera(cameraId: String) async throws {
#if DEBUG
        print("[AppVM] pairCamera → cameraId=\(cameraId)")
#endif
        let response = try await CameraAPIService.shared.pairCamera(cameraId: cameraId)
        pairedCameraId = response.cameraId
#if DEBUG
        print("[AppVM] pairCamera ✓ — cameraId=\(response.cameraId) familyId=\(response.familyId)")
#endif
    }

    // MARK: - Auth state listener

    func listenForAuthChanges() async {
#if DEBUG
        print("[AppVM] listenForAuthChanges — starting auth state listener")
#endif
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(10))
            await MainActor.run { [weak self] in
                if self?.isAuthResolved == false {
#if DEBUG
                    print("[AppVM] ⚠️ Auth resolution timeout — forcing isAuthResolved=true")
#endif
                    self?.isAuthResolved = true
                }
            }
        }
        for await (event, _) in supabase.client.auth.authStateChanges {
#if DEBUG
            print("[AppVM] Auth event: \(event) — userId=\(supabase.currentUserId?.uuidString ?? "nil")")
#endif
            switch event {
            case .signedIn, .initialSession:
#if DEBUG
                print("[AppVM] → loadAll triggered by \(event)")
#endif
                await loadAll()
            case .signedOut, .userDeleted:
#if DEBUG
                print("[AppVM] → clearing session data")
#endif
                unsubscribeRealtime()
                family = nil
                members = []
                inventory = []
                familyId = nil
                pairedCameraId = nil
            default:
#if DEBUG
                print("[AppVM] Auth event \(event) — no action needed")
#endif
                break
            }
            isAuthResolved = true
        }
    }

    func signOut() {
#if DEBUG
        print("[AppVM] signOut requested")
#endif
        Task {
            do {
                try await supabase.signOut()
            } catch {
#if DEBUG
                print("[AppVM] ✗ signOut failed: \(error)")
#endif
                self.error = error.localizedDescription
            }
        }
    }

    func deleteAccount() {
#if DEBUG
        print("[AppVM] deleteAccount requested — userId=\(currentUserId?.uuidString ?? "nil")")
#endif
        Task {
            do {
                try await supabase.deleteUserAccount()
            } catch {
#if DEBUG
                print("[AppVM] ✗ deleteAccount failed: \(error)")
#endif
                self.error = error.localizedDescription
            }
        }
    }

    // MARK: - Local (optimistic) inventory mutations

    func addLocalItem(_ item: InventoryItem) {
#if DEBUG
        print("[AppVM] addLocalItem '\(item.name)' — inventory now \(inventory.count + 1) item(s)")
#endif
        inventory.append(item)
    }

    func removeLocalItem(id: UUID) {
#if DEBUG
        print("[AppVM] removeLocalItem id=\(id)")
#endif
        inventory.removeAll { $0.id == id }
    }

    func updateLocalItem(_ item: InventoryItem) {
#if DEBUG
        print("[AppVM] updateLocalItem '\(item.name)' qty=\(item.quantity)")
#endif
        if let idx = inventory.firstIndex(where: { $0.id == item.id }) {
            inventory[idx] = item
        }
    }

    // MARK: - Remote load

    func refreshInventory() async {
        guard let familyId else { return }
#if DEBUG
        print("[AppVM] refreshInventory — familyId=\(familyId)")
#endif
        do {
            inventory = try await supabase.fetchInventory(familyId: familyId)
#if DEBUG
            print("[AppVM] refreshInventory ✓ — \(inventory.count) item(s)")
#endif
        } catch {
#if DEBUG
            print("[AppVM] refreshInventory ✗ — \(error)")
#endif
            self.error = error.localizedDescription
        }
    }

    func loadAll() async {
#if DEBUG
        print("[AppVM] loadAll — start")
#endif
        isLoading = true
        defer { isLoading = false }

        guard let userId = supabase.currentUserId else {
#if DEBUG
            print("[AppVM] loadAll — no currentUserId, aborting")
#endif
            return
        }
#if DEBUG
        print("[AppVM] loadAll — userId=\(userId)")
#endif

        do {
            self.error = nil
            guard let fetchedFamily = try await supabase.fetchFamilyForUser(userId: userId) else {
#if DEBUG
                print("[AppVM] loadAll — no family found, clearing state")
#endif
                family = nil
                members = []
                inventory = []
                familyId = nil
                isOffline = false
                hasCompletedOnboarding = false
                return
            }
            family = fetchedFamily
            if self.familyId != fetchedFamily.id {
                self.familyId = fetchedFamily.id
            }
            if !hasCompletedOnboarding {
                hasCompletedOnboarding = true
            }
#if DEBUG
            print("[AppVM] loadAll — family '\(fetchedFamily.name)' id=\(fetchedFamily.id)")
#endif

            async let m = supabase.fetchMembers(familyId: fetchedFamily.id)
            async let i = supabase.fetchInventory(familyId: fetchedFamily.id)
            members   = try await m
            inventory = try await i
            isOffline = false
#if DEBUG
            print("[AppVM] loadAll ✓ — \(members.count) member(s), \(inventory.count) inventory item(s)")
#endif
            subscribeRealtime(familyId: fetchedFamily.id)
        } catch {
#if DEBUG
            print("[AppVM] loadAll ✗ — \(error)")
#endif
            isOffline = true
            self.error = error.localizedDescription
        }
    }

    // MARK: - Remote writes (optimistic with rollback)

    func addItem(_ item: InventoryItem) {
#if DEBUG
        print("[AppVM] addItem '\(item.name)' — optimistic add then persist")
#endif
        let snapshot = inventory
        addLocalItem(item)
        Task {
            do {
                try await supabase.addItem(item)
#if DEBUG
                print("[AppVM] addItem ✓ persisted '\(item.name)'")
#endif
            } catch {
#if DEBUG
                print("[AppVM] addItem ✗ rollback — \(error)")
#endif
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func removeItem(id: UUID) {
#if DEBUG
        let name = inventory.first(where: { $0.id == id })?.name ?? id.uuidString
        print("[AppVM] removeItem '\(name)'")
#endif
        let snapshot = inventory
        removeLocalItem(id: id)
        Task {
            do {
                try await supabase.deleteItem(id: id)
#if DEBUG
                print("[AppVM] removeItem ✓ deleted")
#endif
            } catch {
#if DEBUG
                print("[AppVM] removeItem ✗ rollback — \(error)")
#endif
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func updateItem(_ item: InventoryItem) {
#if DEBUG
        print("[AppVM] updateItem '\(item.name)' qty=\(item.quantity)")
#endif
        let snapshot = inventory
        updateLocalItem(item)
        Task {
            do {
                try await supabase.updateItem(item)
#if DEBUG
                print("[AppVM] updateItem ✓ persisted")
#endif
            } catch {
#if DEBUG
                print("[AppVM] updateItem ✗ rollback — \(error)")
#endif
                inventory = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func addMember(_ member: FamilyMember) {
#if DEBUG
        print("[AppVM] addMember '\(member.name)'")
#endif
        let snapshot = members
        members.append(member)
        Task {
            do {
                try await supabase.upsertMember(member)
#if DEBUG
                print("[AppVM] addMember ✓ persisted '\(member.name)'")
#endif
            } catch {
#if DEBUG
                print("[AppVM] addMember ✗ rollback — \(error)")
#endif
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func deleteMember(id: UUID) {
#if DEBUG
        let name = members.first(where: { $0.id == id })?.name ?? id.uuidString
        print("[AppVM] deleteMember '\(name)'")
#endif
        let snapshot = members
        members.removeAll { $0.id == id }
        Task {
            do {
                try await supabase.deleteMember(id: id)
#if DEBUG
                print("[AppVM] deleteMember ✓ persisted")
#endif
            } catch {
#if DEBUG
                print("[AppVM] deleteMember ✗ rollback — \(error)")
#endif
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func updateMember(_ member: FamilyMember) {
#if DEBUG
        print("[AppVM] updateMember '\(member.name)'")
#endif
        let snapshot = members
        if let idx = members.firstIndex(where: { $0.id == member.id }) {
            members[idx] = member
        }
        Task {
            do {
                try await supabase.upsertMember(member)
#if DEBUG
                print("[AppVM] updateMember ✓ persisted")
#endif
            } catch {
#if DEBUG
                print("[AppVM] updateMember ✗ rollback — \(error)")
#endif
                members = snapshot
                self.error = error.localizedDescription
            }
        }
    }

    func saveFamily(_ f: Family, members m: [FamilyMember]) {
#if DEBUG
        print("[AppVM] saveFamily '\(f.name)' with \(m.count) member(s)")
#endif
        let previousFamily = self.family
        let previousMembers = self.members
        let previousFamilyId = self.familyId
        family  = f
        members = m
        familyId = f.id
        Task {
            do {
                guard let userId = supabase.currentUserId else { return }
                try await supabase.upsertFamilyWithUser(f, userId: userId)
                try await supabase.upsertMembers(m)
#if DEBUG
                print("[AppVM] saveFamily ✓ persisted")
#endif
            } catch {
#if DEBUG
                print("[AppVM] saveFamily ✗ rollback — \(error)")
#endif
                self.family = previousFamily
                self.members = previousMembers
                self.familyId = previousFamilyId
                self.error = error.localizedDescription
            }
        }
    }

    func saveFamilyAsync(_ f: Family, members m: [FamilyMember]) async throws {
        guard let userId = supabase.currentUserId else { return }
#if DEBUG
        print("[AppVM] saveFamilyAsync — userId=\(userId)")
        print("[AppVM] saveFamilyAsync — familyId=\(f.id) name='\(f.name)' skill='\(f.cookingSkillLevel)' budget='\(f.budgetRange)'")
        print("[AppVM] saveFamilyAsync — \(m.count) member(s):")
        for member in m {
            print("[AppVM]   member id=\(member.id) name='\(member.name)' familyId=\(member.familyId)")
        }
        print("[AppVM] saveFamilyAsync — upserting family…")
#endif
        try await supabase.upsertFamilyWithUser(f, userId: userId)
#if DEBUG
        print("[AppVM] saveFamilyAsync — family upserted ✓, upserting \(m.count) member(s)…")
#endif
        try await supabase.upsertMembers(m)
        family = f
        self.members = m
        familyId = f.id
#if DEBUG
        print("[AppVM] saveFamilyAsync ✓ done — familyId=\(f.id) members=\(m.count)")
#endif
        subscribeRealtime(familyId: f.id)
    }

    // MARK: - Realtime

    private func subscribeRealtime(familyId: UUID) {
        guard subscribedFamilyId != familyId else {
#if DEBUG
            print("[AppVM] subscribeRealtime — already subscribed to \(familyId), skipping")
#endif
            return
        }
#if DEBUG
        print("[AppVM] subscribeRealtime — setting up for familyId=\(familyId)")
#endif
        subscribedFamilyId = familyId

        let old = (membersChannel, inventoryChannel)
        membersChannel = nil
        inventoryChannel = nil

        realtimeTask?.cancel()
        realtimeTask = Task {
            await old.0?.unsubscribe()
            await old.1?.unsubscribe()
            self.membersChannel = await self.supabase.subscribeToMembers(familyId: familyId) { [weak self] updated in
                Task { @MainActor [weak self] in
#if DEBUG
                    print("[AppVM] Realtime members update — \(updated.count) member(s)")
#endif
                    self?.members = updated
                }
            }
            self.inventoryChannel = await self.supabase.subscribeToInventory(familyId: familyId) { [weak self] updated in
                Task { @MainActor [weak self] in
#if DEBUG
                    print("[AppVM] Realtime inventory update — \(updated.count) item(s)")
#endif
                    self?.inventory = updated
                }
            }
        }
    }

    private func unsubscribeRealtime() {
#if DEBUG
        print("[AppVM] unsubscribeRealtime — tearing down channels")
#endif
        subscribedFamilyId = nil
        realtimeTask?.cancel()
        realtimeTask = nil
        let m = membersChannel
        let i = inventoryChannel
        membersChannel = nil
        inventoryChannel = nil
        Task {
            await m?.unsubscribe()
            await i?.unsubscribe()
#if DEBUG
            print("[AppVM] unsubscribeRealtime ✓ done")
#endif
        }
    }

}
