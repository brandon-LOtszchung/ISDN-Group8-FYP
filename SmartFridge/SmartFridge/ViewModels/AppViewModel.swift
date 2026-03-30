// ViewModels/AppViewModel.swift
import Foundation

@Observable
@MainActor
final class AppViewModel {
    var family: Family?
    var members: [FamilyMember] = []
    var inventory: [InventoryItem] = []
    var fridgeInitialized: Bool {
        didSet { UserDefaults.standard.set(fridgeInitialized, forKey: Constants.StorageKeys.fridgeInitialized) }
    }
    var isLoading = false
    var error: String?
    var hasCompletedOnboarding: Bool {
        didSet { UserDefaults.standard.set(hasCompletedOnboarding, forKey: Constants.StorageKeys.hasCompletedOnboarding) }
    }

    private let supabase = SupabaseService.shared

    init() {
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: Constants.StorageKeys.hasCompletedOnboarding)
        self.fridgeInitialized = UserDefaults.standard.bool(forKey: Constants.StorageKeys.fridgeInitialized)
    }

    // MARK: - Onboarding

    func completeOnboarding() {
        hasCompletedOnboarding = true
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
        do {
            async let f = supabase.fetchFamily()
            async let m = supabase.fetchMembers(familyId: Constants.defaultFamilyID)
            async let i = supabase.fetchInventory(familyId: Constants.defaultFamilyID)
            family    = try await f
            members   = try await m
            inventory = try await i
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Remote writes (fire-and-forget with local optimistic update)

    func addItem(_ item: InventoryItem) {
        addLocalItem(item)
        Task {
            do { try await supabase.addItem(item) }
            catch { self.error = error.localizedDescription }
        }
    }

    func removeItem(id: UUID) {
        removeLocalItem(id: id)
        Task {
            do { try await supabase.deleteItem(id: id) }
            catch { self.error = error.localizedDescription }
        }
    }

    func updateMember(_ member: FamilyMember) {
        if let idx = members.firstIndex(where: { $0.id == member.id }) {
            members[idx] = member
        }
        Task {
            do { try await supabase.upsertMember(member) }
            catch { self.error = error.localizedDescription }
        }
    }

    func saveFamily(_ f: Family, members m: [FamilyMember]) {
        family  = f
        members = m
        Task {
            do {
                try await supabase.upsertFamily(f)
                for member in m { try await supabase.upsertMember(member) }
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
