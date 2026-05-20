# SmartFridge — App Store Readiness Plan

## Project Overview

**App:** SmartFridge — AI-powered fridge management for families  
**Platform:** iOS (SwiftUI, iOS 17+, `@Observable`)  
**Codebase:** `/SmartFridge/SmartFridge/`  
**Branch:** `ios-swift-app`

## Backend Infrastructure

| Service | URL | Purpose |
|---|---|---|
| Supabase | `https://dpgxcyktcptsnihpitjr.supabase.co` | DB, Auth, Realtime |
| REST API | `http://152.42.221.192:8000` | AI fridge scan, recipe engine |

**Supabase project ref:** `dpgxcyktcptsnihpitjr` (org: `kezebbzbxxnftuwyabot`, "isdn project")  
**Note:** REST API is HTTP-only (no domain). ATS exception already in Info.plist. Leaving as-is.

## Database Tables (public schema)

| Table | Key columns |
|---|---|
| `families` | `id UUID`, `name`, `cooking_skill_level`, `budget_range`, `preferred_language`, `user_id` (added by migration) |
| `family_members` | `id UUID`, `family_id UUID`, `name`, `age` (nullable after migration), `dietary_restrictions[]`, `allergies[]`, `health_conditions[]`, `spice_level`, `favorite_cuisines[]`, `disliked_ingredients[]` |
| `inventory_items` | `id UUID`, `family_id UUID`, `name`, `category`, `quantity`, `expiry_date`, `added_at` |
| `shopping_list_items` | `id UUID`, `family_id UUID`, `name`, `quantity`, `unit`, `is_purchased`, `estimated_unit_cost`, `alternatives[]`, `recipe_name` (added by migration) |
| `saved_recipes` | `id UUID`, `family_id UUID`, `recipe_data JSONB`, `is_favorite`, `cuisine_style`, etc. |

## Issues & Fix Status

| # | Issue | Priority | Status |
|---|---|---|---|
| 1 | No auth — all users share hardcoded family UUID | 🔴 Blocker | ✅ Done |
| 2 | Swift models don't match flat DB schema (nested `preferences` vs flat columns) | 🔴 Blocker | ✅ Done |
| 3 | RLS not enabled — any user can read/write any family's data | 🔴 Blocker | ✅ Done |
| 4 | `shopping_list_items` missing `recipe_name` column | 🔴 Blocker | ✅ Done |
| 5 | `family_members.age` NOT NULL but Swift model uses `Int?` | 🔴 Blocker | ✅ Done |
| 6 | HTTP API (no HTTPS, raw IP) — ATS exception in Info.plist | 🟡 Known | ⏭️ Skipped (no domain) |
| 7 | `PlanningViewModel` scoped inside view — resets on tab switch | 🟡 Quality | ✅ Done |
| 8 | Optimistic updates have no rollback on write failure | 🟡 Quality | ✅ Done |
| 9 | Silent fallback to demo data — no offline error shown | 🟡 Quality | ✅ Done |
| 10 | Supabase anon key hardcoded in `project.pbxproj` | 🟡 Security | ✅ Done (RLS mitigates) |
| 11 | New files missing from Xcode project (Utils, Auth, Onboarding, BudgetSlider) | 🔴 Build | ✅ Done |
| 12 | `RecipeDetailView` actor-isolation error on `appVM.inventory` in sort closure | 🔴 Build | ✅ Done |

## Build Status

✅ **Builds clean** — `xcodebuild` iOS Simulator build passes with 0 errors, 3 warnings (all pre-existing/upstream).

Note: SourceKit may show stale "Cannot find X in scope" diagnostics in the IDE after these changes. These are false positives — do a full clean build (`Cmd+Shift+K` then `Cmd+B`) in Xcode to clear them.

## Migrations Applied to Supabase

1. `add_user_id_to_families` — adds `user_id UUID REFERENCES auth.users` to families
2. `add_recipe_name_to_shopping_list` — adds `recipe_name TEXT` to shopping_list_items
3. `make_age_nullable` — drops NOT NULL on family_members.age
4. `enable_rls_and_policies` — enables RLS + per-user policies on all tables

## iOS Code Changes

### Models (Models.swift)
- Flattened `Family` — removed `FamilyPreferences` nested struct, added `cookingSkillLevel`, `budgetRange`, `preferredLanguage` directly with snake_case `CodingKeys`
- Flattened `FamilyMember` — removed `MemberPreferences` nested struct, added `spiceLevel`, `favoriteCuisines`, `dislikedIngredients` directly with snake_case `CodingKeys`

### Auth (SupabaseService.swift)
- `sendPhoneOTP(phone:)` → `client.auth.signInWithOTP(phone:)` — sends SMS
- `verifyPhoneOTP(phone:token:)` → `client.auth.verifyOTP(phone:token:type:.sms)` — verifies 6-digit code
- `signInWithApple(credential:nonce:)` → SIWA via `signInWithIdToken`
- `signOut()` → clears session
- `currentUserId` → `auth.uid()` equivalent

### App Flow (ContentView.swift)
```
Not authenticated → LoginView (sign in / sign up)
Authenticated + no family → OnboardingView (creates family with user_id)
Authenticated + family exists → MainTabView
```

### AppViewModel
- Removed `Constants.defaultFamilyID` — family UUID fetched from DB after auth
- `loadAll()` fetches family by `user_id = auth.uid()`, stores `familyId` dynamically
- Optimistic updates have snapshot + rollback on write failure

### PlanningViewModel
- Moved to `@State` in `SmartFridgeApp` alongside `AppViewModel` and `ShoppingViewModel`

## App Store Remaining Checklist

- [x] App icon — `Assets.xcassets/AppIcon.appiconset/AppIcon.png` (1024×1024 placeholder; replace with final design — image generation quota exhausted, retry or use your own)
- [x] Phone OTP login — `LoginView` is a 2-step flow: phone number entry (+country code) → 6-digit SMS OTP (auto-fills from iOS); `SupabaseService.sendPhoneOTP` + `verifyPhoneOTP`; enable Phone provider in Supabase dashboard → Auth → Providers
- [x] Sign in with Apple — entitlements file + SIWA button in LoginView + `SupabaseService.signInWithApple()`; enable "Sign In with Apple" provider in Supabase dashboard → Auth → Providers
- [x] Privacy Policy link — shown in Profile tab "About" section; update `privacyPolicyURL` in `TopBarView.swift:5` to your hosted URL before submission
- [x] Sign Out button — added to Profile tab bottom safe area
- [ ] Privacy Policy hosted URL — must be publicly accessible before App Store Connect submission
- [ ] App Store Connect listing (screenshots, description, keywords, category)
- [ ] Bundle ID `com.smartfridge.app` registered in Apple Developer Portal (Certificates, Identifiers & Profiles)
- [ ] "Sign In with Apple" capability registered for the bundle ID in Apple Developer Portal
- [ ] Distribution certificate + provisioning profile (Archive → Distribute in Xcode)
- [ ] TestFlight build for internal testing (requires archive + upload)

## Sign in with Apple — Supabase Setup Required

Before SIWA works in production, enable it in Supabase:
1. Dashboard → Project `dpgxcyktcptsnihpitjr` → Authentication → Providers → Apple
2. Enter your Apple Services ID or bundle ID (`com.smartfridge.app`)
3. Enter your Apple Team ID (`74VR9HTLL9`), Key ID, and private key (.p8 file from Apple Developer Portal)

## Build Notes

- 3 pre-existing warnings (nonisolated, deprecated subscribe, BounceSymbolEffect iOS 18) — all upstream/Supabase SDK, safe to ignore
- SourceKit shows stale "Cannot find X in scope" errors — false positives, clear with Cmd+Shift+K then Cmd+B in Xcode
