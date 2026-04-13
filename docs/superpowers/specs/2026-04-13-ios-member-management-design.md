# iOS Member Management — Design Spec

**Date:** 2026-04-13  
**Branch:** ios-swift-app  
**Status:** Approved

---

## Overview

Add the ability to add new family members and remove existing ones from the Profile tab of the iOS SmartFridge app. The web app and Supabase backend already support these operations; this spec closes the gap on the iOS side.

---

## Interaction Pattern

- **Add:** A `+` button in the Profile tab's navigation bar opens a modal sheet containing the full member profile form (name, age, dietary restrictions, allergies, health conditions, preferences, disliked ingredients). Tapping **Save** creates the member; tapping **Cancel** dismisses without changes.
- **Delete:** Swiping left on any member row reveals a red **Delete** button. Tapping it presents a confirmation alert — "Remove [Name]?" with a destructive **Delete** action and a **Cancel** action. Confirming removes the member.

---

## Architecture

### `AppViewModel` — two new methods

Following the existing fire-and-forget + optimistic update pattern used by inventory operations:

```swift
func addMember(_ member: FamilyMember) {
    members.append(member)
    Task {
        do { try await supabase.upsertMember(member) }
        catch { self.error = error.localizedDescription }
    }
}

func deleteMember(id: UUID) {
    members.removeAll { $0.id == id }
    Task {
        do { try await supabase.deleteMember(id: id) }
        catch { self.error = error.localizedDescription }
    }
}
```

### `MemberProfileView` — dual create/edit mode

Change the initialiser from `init(memberId: UUID)` to `init(memberId: UUID?)`:

- **`nil`** → create mode: `load()` is a no-op (form starts blank); `save()` constructs a new `FamilyMember(id: UUID(), familyId: Constants.defaultFamilyID, ...)` and calls `appVM.addMember()`, then dismisses.
- **non-nil** → edit mode: existing behaviour unchanged.

The navigation title shows `String(localized: "profile.member.add_title")` when in create mode, or the member's name when editing.

The `NavigationLink(value: member.id)` in `ProfileDrawerView` continues to pass a non-nil UUID, so the edit path is unaffected.

The add sheet wraps `MemberProfileView(memberId: nil)` in a `NavigationStack` so the view's own toolbar Save button renders correctly inside the sheet.

### `ProfileDrawerView` — three additions (in `TopBarView.swift`)

1. **`@State private var showAddMember = false`** — drives the add sheet.
2. **`@State private var memberToDelete: FamilyMember? = nil`** — drives the delete confirmation alert (non-nil = alert visible).
3. **Toolbar button:** `.toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showAddMember = true } label: { Image(systemName: "plus") } } }`
4. **Add sheet:** `.sheet(isPresented: $showAddMember) { NavigationStack { MemberProfileView(memberId: nil) }.environment(appVM)... }`
5. **Swipe action:** `.swipeActions(edge: .trailing) { Button(role: .destructive) { memberToDelete = member } label: { Label("Delete", systemImage: "trash") } }` on each `NavigationLink` row.
6. **Confirmation alert:** `.alert(...)` bound to `memberToDelete` — title uses the member's name, destructive button calls `appVM.deleteMember(id:)` and nils out `memberToDelete`.

---

## Localization

Three new keys added to all four `.strings` files (`en`, `zh-Hant`, `fil`, `id`):

| Key | en | zh-Hant | fil | id |
|-----|-----|---------|-----|-----|
| `profile.member.add_title` | New Member | 新成員 | Bagong Miyembro | Anggota Baru |
| `profile.member.delete_confirm_title` | Remove Member? | 移除成員？ | Alisin ang Miyembro? | Hapus Anggota? |
| `profile.member.delete_confirm_message` | This member and their preferences will be permanently removed. | 此成員及其偏好設定將被永久移除。 | Ang miyembro at kanilang mga kagustuhan ay permanenteng maaalis. | Anggota ini dan preferensinya akan dihapus secara permanen. |

---

## Files Changed

| File | Change |
|------|--------|
| `ViewModels/AppViewModel.swift` | Add `addMember` and `deleteMember` methods |
| `Views/Profile/MemberProfileView.swift` | Refactor `memberId: UUID` → `memberId: UUID?` for dual create/edit |
| `Views/Shared/TopBarView.swift` | Add `+` button, swipe-to-delete, confirmation alert to `ProfileDrawerView` |
| `Resources/en.lproj/Localizable.strings` | Add 3 new keys |
| `Resources/zh-Hant.lproj/Localizable.strings` | Add 3 new keys |
| `Resources/fil.lproj/Localizable.strings` | Add 3 new keys |
| `Resources/id.lproj/Localizable.strings` | Add 3 new keys |

---

## Out of Scope

- Reordering members
- Editing the family name from this screen
- Member avatars / photos
