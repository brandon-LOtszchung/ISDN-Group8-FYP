# HTML Demo Sync — Brandon's Apr 28 Batch

**Date:** 2026-05-04  
**Branch:** ios-swift-app  
**File:** `smartfridge-interactive.html`

## Context

Brandon's April 28 batch commits built the production iOS Swift app. Most features
were already reflected in the HTML interactive demo through tweety's prior commits.
Three gaps remain that need closing.

## Changes

### 1. Member state model upgrade

**Why:** `S.members` is currently `['Mom', 'Dad']` — plain name strings. The iOS
`FamilyMember` model stores dietary, allergies, health conditions, spice level,
favourite cuisines, and disliked ingredients per member. Editing a member profile and
hitting Save in the HTML discards all preferences silently; only the name is kept.

**What changes:**

`S.members` becomes an array of member objects:
```js
{
  id: Number,          // Date.now() at creation
  name: String,
  age: String,         // '' if not set
  dietary: [],         // Array<String>
  allergies: [],
  health: [],
  spice: '',           // '' | 'None' | 'Mild' | 'Medium' | 'Hot'
  cuisines: [],
  disliked: [],
}
```

Use plain arrays (not Sets) so they survive JSON round-trips and are easier to
render. Convert to Set on the way into toggle functions; convert back to array on
save.

`S.selectedMembers` switches from a `Set<String>` (member names) to a `Set<Number>`
(member ids). Plan tab member pills reference `member.id` for toggle/display.

**Touch points:**

| Location | Change |
|----------|--------|
| `S` initial state | `members: [{id:1,name:'Mom',…},{id:2,name:'Dad',…}]`, `selectedMembers: new Set([1,2])` |
| Onboarding `renderMembers()` | Render `m.name`; `addMember()` pushes a new object |
| Onboarding `addMember()` | Creates `{id: Date.now(), name:'', age:'', dietary:[], …}` |
| `renderProfile()` | Shows `m.name` + optional age subtitle; swipe data-id uses `m.id` |
| `showMemberProfile(index)` | Loads all fields from `S.members[index]` into `MP` |
| `saveMemberProfile()` | Writes all MP fields back to `S.members[MP.index]`; also updates `S.selectedMembers` if name changed |
| `renderAddMemberForm()` | No structural change — already has all fields |
| `submitAddMember()` | Pushes a full member object; `S.selectedMembers.add(newMember.id)` |
| `confirmDeleteMember()` | Removes by index; deletes `m.id` from `S.selectedMembers` |
| `renderPlan()` member pills | `S.members.map(m => pill(m.name, S.selectedMembers.has(m.id), () => toggleMember(m.id)))` |
| `toggleMember(id)` | Toggles id in `S.selectedMembers` (was toggling name string) |

### 2. Profile tab: About section + Sign-out

**Why:** iOS `ProfileDrawerView` has an About section and a sign-out button. Neither
exists in the HTML.

**What to add to `renderProfile()`:**

After the Members inset, add:

```
ABOUT section (grouped inset card)
  Row: "Privacy Policy"  →  onclick opens privacy URL in new tab (chevron disclosure)
  Row: "Version"         →  right-aligned "1.0"
```

Below the scroll area, add a full-width sign-out button anchored at the bottom
(matches iOS `safeAreaInset(edge: .bottom)`):

```
[Sign Out]  — danger colour, triggers confirm() dialog before showing toast "Signed out"
```

### 3. Localization strings

Add to both `STRINGS.en` and `STRINGS.zh`:

| Key | EN | ZH |
|-----|----|----|
| `profile.about` | `'About'` | `'關於'` |
| `profile.privacy_policy` | `'Privacy Policy'` | `'私隱政策'` |
| `profile.version` | `'Version'` | `'版本'` |
| `profile.sign_out` | `'Sign Out'` | `'登出'` |
| `profile.sign_out_confirm` | `'Are you sure you want to sign out?'` | `'您確定要登出嗎？'` |

## Out of Scope

- Backend/Supabase integration (HTML is a purely in-memory demo)
- Dark mode / theme changes beyond what already exists
- Any changes to inventory, planning, shopping, or onboarding tabs
- New screens or navigation flows
