# SmartFridge — Supabase Backend Reference

> **Canonical production reference.** All information in this document was derived from live queries against the production database on 2026-05-04. Do not edit by hand; regenerate from the SQL queries listed at the bottom of this file.

---

## 1. Project Info

| Property | Value |
|---|---|
| Project name | isdn project |
| Project ref | `dpgxcyktcptsnihpitjr` |
| Project URL | `https://dpgxcyktcptsnihpitjr.supabase.co` |
| Region | `ap-southeast-1` (Singapore) |
| Status | `ACTIVE_HEALTHY` |
| PostgreSQL version | 17.6 (compiled for aarch64-unknown-linux-gnu, GCC 15.2.0, 64-bit) |
| Postgres engine | 17 |
| Release channel | `ga` |
| Organisation ID | `kezebbzbxxnftuwyabot` |
| Created at | 2026-03-17T04:13:13Z |

---

## 2. Tables

Five public tables exist. All are protected by Row Level Security (RLS). The ownership chain is:

```
auth.users  ──(user_id)──►  families  ──(family_id)──►  family_members
                                                    ──►  inventory_items
                                                    ──►  saved_recipes
                                                    ──►  shopping_list_items
```

### 2.1 `families`

Stores one row per family group. Each family is owned by exactly one authenticated Supabase user.

**Current row count: 1**

#### Columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `name` | `text` | NO | — | Display name of the family |
| `cooking_skill_level` | `text` | NO | — | CHECK constraint; see §5 |
| `budget_range` | `text` | NO | — | CHECK constraint; see §5 |
| `preferred_language` | `text` | NO | — | CHECK constraint; see §5 |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id` (SET NULL on delete); used by all RLS policies |
| `created_at` | `timestamptz` | YES | `now()` | Set on insert |
| `updated_at` | `timestamptz` | YES | `now()` | Maintained by trigger |

#### Indexes

| Index name | Definition |
|---|---|
| `families_pkey` | `UNIQUE BTREE (id)` — primary key |
| `idx_families_user_id` | `BTREE (user_id)` — used by every RLS policy sub-select |

#### RLS Policy

| Policy name | Command | Applies to | USING expression | WITH CHECK expression |
|---|---|---|---|---|
| Users manage own family | ALL | `public` | `user_id = (SELECT auth.uid())` | `user_id = (SELECT auth.uid())` |

RLS is **PERMISSIVE**. A row is visible/writable only when `user_id` matches the authenticated caller.

#### Triggers

| Trigger name | Event | Action |
|---|---|---|
| `families_updated_at` | UPDATE | `EXECUTE FUNCTION update_updated_at()` |

---

### 2.2 `family_members`

Stores individual members that belong to a family. Used by the recipe AI to personalise suggestions (dietary restrictions, allergies, spice preference, etc.).

**Current row count: 0**

#### Columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `family_id` | `uuid` | NO | — | FK → `families.id` |
| `name` | `text` | NO | — | Member display name |
| `age` | `integer` | YES | — | CHECK: 1–120 (inclusive) |
| `dietary_restrictions` | `text[]` | NO | `'{}'::text[]` | e.g. `vegetarian`, `vegan`, `halal` |
| `allergies` | `text[]` | NO | `'{}'::text[]` | e.g. `peanuts`, `shellfish` |
| `health_conditions` | `text[]` | NO | `'{}'::text[]` | e.g. `diabetes`, `hypertension` — added in migration 001 |
| `spice_level` | `text` | YES | — | CHECK constraint; see §5 |
| `favorite_cuisines` | `text[]` | NO | `'{}'::text[]` | e.g. `Chinese`, `Italian` — added in migration 001 |
| `disliked_ingredients` | `text[]` | NO | `'{}'::text[]` | e.g. `cilantro`, `liver` — added in migration 001 |
| `created_at` | `timestamptz` | YES | `now()` | Set on insert |
| `updated_at` | `timestamptz` | YES | `now()` | Maintained by triggers |

#### Indexes

| Index name | Definition |
|---|---|
| `family_members_pkey` | `UNIQUE BTREE (id)` — primary key |
| `idx_family_members_family_id` | `BTREE (family_id)` — used by RLS sub-select |

#### RLS Policy

| Policy name | Command | Applies to | USING expression | WITH CHECK expression |
|---|---|---|---|---|
| Users manage own family members | ALL | `public` | `family_id IN (SELECT families.id FROM families WHERE families.user_id = auth.uid())` | same |

#### Triggers

| Trigger name | Event | Action |
|---|---|---|
| `family_members_updated_at` | UPDATE | `EXECUTE FUNCTION update_updated_at()` |
| `handle_updated_at_family_members` | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |

> Note: Two triggers fire on UPDATE — both set `updated_at`. The `moddatetime` extension trigger (`handle_updated_at_*`) was added by the Supabase dashboard; the `*_updated_at` trigger is from the custom `update_updated_at()` function. The net result is harmless (both write `NOW()`) but the duplication is worth cleaning up.

---

### 2.3 `inventory_items`

Stores fridge/pantry items for a family. The expiry date drives the "expiring soon" banner in the iOS Inventory view.

**Current row count: 1**

#### Columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `family_id` | `uuid` | NO | — | FK → `families.id` |
| `name` | `text` | NO | — | CHECK: trimmed length > 0 |
| `category` | `text` | NO | — | CHECK constraint; see §5 |
| `quantity` | `numeric` | NO | — | CHECK: > 0 |
| `unit` | `text` | NO | `''::text` | Free-text unit string (e.g. `kg`, `pcs`) |
| `expiry_date` | `date` | YES | — | ISO-8601 date; PostgREST returns `YYYY-MM-DD` |
| `added_at` | `timestamptz` | YES | `now()` | Set on insert |
| `updated_at` | `timestamptz` | YES | `now()` | Maintained by triggers |

#### Indexes

| Index name | Definition |
|---|---|
| `inventory_items_pkey` | `UNIQUE BTREE (id)` — primary key |
| `idx_inventory_items_family_id` | `BTREE (family_id)` |
| `idx_inventory_items_expiry_date` | `BTREE (family_id, expiry_date)` — composite; used for expiry-sorted queries |

#### RLS Policy

| Policy name | Command | Applies to | USING expression | WITH CHECK expression |
|---|---|---|---|---|
| Users manage own inventory | ALL | `public` | `family_id IN (SELECT families.id FROM families WHERE families.user_id = auth.uid())` | same |

#### Triggers

| Trigger name | Event | Action |
|---|---|---|
| `inventory_items_updated_at` | UPDATE | `EXECUTE FUNCTION update_updated_at()` |
| `handle_updated_at_inventory_items` | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |

---

### 2.4 `saved_recipes`

Persists AI-generated recipe recommendations for a family. The full recipe payload (ingredients, steps, missing ingredients) is stored as a JSONB blob in `recipe_data`; the top-level columns mirror key fields for efficient filtering without parsing JSON.

**Current row count: 25**

#### Columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `family_id` | `uuid` | NO | — | FK → `families.id` |
| `recipe_data` | `jsonb` | NO | — | Full recipe payload; see §2.4.1 for expected shape |
| `is_favorite` | `boolean` | YES | `false` | User-starred indicator |
| `cuisine_style` | `text` | YES | — | Denormalised copy of `recipe_data->cuisine_style` for indexed filtering |
| `matched_count` | `integer` | NO | `0` | CHECK: >= 0; matched_count <= total_count |
| `total_count` | `integer` | NO | `0` | CHECK: >= 0 |
| `estimated_total_cost` | `numeric` | YES | — | CHECK: >= 0; in local currency units |
| `created_at` | `timestamptz` | YES | `now()` | Set on insert |

#### Indexes

| Index name | Definition |
|---|---|
| `saved_recipes_pkey` | `UNIQUE BTREE (id)` — primary key |
| `idx_saved_recipes_family_id` | `BTREE (family_id)` |
| `idx_saved_recipes_family_created` | `BTREE (family_id, created_at DESC)` — used for chronological listing |
| `idx_saved_recipes_family_cuisine` | `BTREE (family_id, cuisine_style)` — used for cuisine-type filtering |

#### RLS Policy

| Policy name | Command | Applies to | USING expression | WITH CHECK expression |
|---|---|---|---|---|
| Users manage own saved recipes | ALL | `public` | `family_id IN (SELECT families.id FROM families WHERE families.user_id = auth.uid())` | same |

#### Triggers

None on `saved_recipes` (no `updated_at` column, so no update trigger is needed).

#### 2.4.1 `recipe_data` JSONB Shape

The JSONB blob mirrors the payload produced by the recipe-recommendation backend and decoded by `SavedRecipeData` in Swift:

```json
{
  "name": "String — recipe display name",
  "cuisine_style": "String",
  "matched_count": 3,
  "total_count": 5,
  "calories": 420,
  "ingredients": [
    { "name": "chicken breast", "quantity": 200.0, "unit": "g", "required": true }
  ],
  "steps": ["Step 1 text", "Step 2 text"],
  "missing_ingredients": [
    { "name": "soy sauce", "quantity": 2.0, "unit": "tbsp", "alternatives": ["tamari"] }
  ]
}
```

Fields `ingredients`, `steps`, and `missing_ingredients` default to empty arrays if absent. `calories` is optional.

---

### 2.5 `shopping_list_items`

Stores items on the family's shopping list. Items can be generated by the recipe planner (linked via `recipe_name`) or added manually. Realtime subscriptions in the iOS app listen to this table.

**Current row count: 7**

#### Columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `family_id` | `uuid` | NO | — | FK → `families.id` |
| `name` | `text` | NO | — | CHECK: trimmed length > 0 |
| `quantity` | `numeric` | NO | — | CHECK: > 0 |
| `unit` | `text` | NO | — | Free-text unit string |
| `alternatives` | `text[]` | YES | `'{}'::text[]` | Suggested substitute products |
| `is_purchased` | `boolean` | YES | `false` | Checked-off indicator |
| `estimated_unit_cost` | `numeric` | YES | — | CHECK: >= 0 |
| `recipe_name` | `text` | YES | — | Links item back to generating recipe; used for "group by recipe" UI — added in migration 001 |
| `created_at` | `timestamptz` | YES | `now()` | Set on insert |
| `updated_at` | `timestamptz` | YES | `now()` | Maintained by triggers |

#### Indexes

| Index name | Definition |
|---|---|
| `shopping_list_items_pkey` | `UNIQUE BTREE (id)` — primary key |
| `idx_shopping_list_items_family_id` | `BTREE (family_id)` |
| `shopping_list_items_family_name_recipe_key` | `UNIQUE BTREE (family_id, name, recipe_name)` — prevents duplicate items per recipe within a family |

#### RLS Policy

| Policy name | Command | Applies to | USING expression | WITH CHECK expression |
|---|---|---|---|---|
| Users manage own shopping list | ALL | `public` | `family_id IN (SELECT families.id FROM families WHERE families.user_id = auth.uid())` | same |

#### Triggers

| Trigger name | Event | Action |
|---|---|---|
| `shopping_list_items_updated_at` | UPDATE | `EXECUTE FUNCTION update_updated_at()` |
| `handle_updated_at_shopping_list_items` | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |

---

## 3. Database Functions / Stored Procedures

Two functions are defined in the `public` schema.

### 3.1 `update_updated_at()`

**Type:** trigger function  
**Returns:** `trigger`  
**Language:** PL/pgSQL

```sql
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
```

**Purpose:** Sets `updated_at` to the current timestamp on every UPDATE. Called by the `*_updated_at` triggers on `families`, `family_members`, `inventory_items`, and `shopping_list_items`.

---

### 3.2 `rls_auto_enable()`

**Type:** event trigger function  
**Returns:** `event_trigger`  
**Language:** PL/pgSQL

**Purpose:** Automatically enables Row Level Security on any new table created in the `public` schema. Fires on the DDL events `CREATE TABLE`, `CREATE TABLE AS`, and `SELECT INTO`. This ensures that any future table created via migration or the Supabase dashboard has RLS enabled by default.

The function skips system schemas (`pg_catalog`, `information_schema`, `pg_toast*`, `pg_temp*`) and only acts on tables in `public`.

---

## 4. Edge Functions

No Edge Functions are deployed to this project.

---

## 5. Intended Field Contracts

These are the enforced value sets derived from live CHECK constraints in production.

### `families.cooking_skill_level`

Must be one of:
- `beginner`
- `intermediate`
- `advanced`

### `families.budget_range`

Must be one of:
- `low`
- `medium`
- `high`

### `families.preferred_language`

Must be one of:
- `en` — English
- `zh-HK` — Traditional Chinese (Hong Kong)
- `fil` — Filipino
- `id` — Bahasa Indonesia

### `family_members.age`

- Integer, range: 1 to 120 (inclusive)
- Nullable; omit for age-unknown members

### `family_members.spice_level`

Must be one of (when provided):
- `none`
- `mild`
- `medium`
- `hot`

### `inventory_items.category`

Must be one of:
- `Protein`
- `Vegetable`
- `Fruit`
- `Dairy`
- `Grain`
- `Condiment`
- `Beverage`
- `Other`

### `inventory_items.quantity`

- Numeric, must be > 0 (strictly positive)

### `inventory_items.name` / `shopping_list_items.name`

- Text, trimmed length must be > 0 (rejects blank or whitespace-only strings)

### `shopping_list_items.quantity`

- Numeric, must be > 0 (strictly positive)

### `shopping_list_items.estimated_unit_cost`

- Numeric, must be >= 0 when provided

### `saved_recipes.matched_count`

- Integer, must be >= 0
- Must be <= `total_count` (enforced by `saved_recipes_check` constraint)

### `saved_recipes.total_count`

- Integer, must be >= 0

### `saved_recipes.estimated_total_cost`

- Numeric, must be >= 0 when provided

---

## 6. iOS Swift Model Mapping

Each table maps to a Swift struct in `SmartFridge/SmartFridge/Models/Models.swift`.

### 6.1 `families` → `Family`

| DB column | Swift property | Swift type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Fully mapped |
| `name` | `name` | `String` | Fully mapped |
| `cooking_skill_level` | `cookingSkillLevel` | `String` | Raw string; no enforcement of the enum values in Swift |
| `budget_range` | `budgetRange` | `String` | Raw string; no enforcement of the enum values in Swift |
| `preferred_language` | `preferredLanguage` | `AppLanguage` | Mapped to `AppLanguage` enum with raw values `en`, `zh-HK`, `fil`, `id` |
| `user_id` | `userId` | `UUID?` | Optional in Swift even though NOT NULL in DB |
| `created_at` | `createdAt` | `Date?` | Fully mapped |
| `updated_at` | `updatedAt` | `Date?` | Fully mapped |

**Fields not mapped in Swift model:** None. All columns are represented.

---

### 6.2 `family_members` → `FamilyMember`

| DB column | Swift property | Swift type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Fully mapped |
| `family_id` | `familyId` | `UUID` | Fully mapped |
| `name` | `name` | `String` | Fully mapped |
| `age` | `age` | `Int?` | Fully mapped |
| `dietary_restrictions` | `dietaryRestrictions` | `[String]` | Defaults to `[]` if absent |
| `allergies` | `allergies` | `[String]` | Defaults to `[]` if absent |
| `health_conditions` | `healthConditions` | `[String]` | Defaults to `[]` if absent |
| `spice_level` | `spiceLevel` | `String?` | Fully mapped; no Swift-side validation of allowed values |
| `favorite_cuisines` | `favoriteCuisines` | `[String]` | Defaults to `[]` if absent |
| `disliked_ingredients` | `dislikedIngredients` | `[String]` | Defaults to `[]` if absent |
| `created_at` | — | — | **NOT mapped** in `FamilyMember` struct |
| `updated_at` | — | — | **NOT mapped** in `FamilyMember` struct |

**Fields not mapped in Swift model:** `created_at`, `updated_at`

---

### 6.3 `inventory_items` → `InventoryItem`

| DB column | Swift property | Swift type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Fully mapped |
| `family_id` | `familyId` | `UUID` | Fully mapped |
| `name` | `name` | `String` | Fully mapped |
| `category` | `category` | `String` | Raw string; no Swift-side enum for the 8 allowed categories |
| `quantity` | `quantity` | `Double` | Custom decoder handles both `Double` and quoted-string from PostgREST |
| `unit` | `unit` | `String` | Defaults to `""` if absent |
| `expiry_date` | `expiryDate` | `Date?` | Custom decoder tries ISO8601 first, falls back to `yyyy-MM-dd` formatter for Supabase direct path |
| `added_at` | — | — | **NOT mapped** in `InventoryItem` struct |
| `updated_at` | — | — | **NOT mapped** in `InventoryItem` struct |

**Fields not mapped in Swift model:** `added_at`, `updated_at`

---

### 6.4 `saved_recipes` → `SavedRecipe` + `SavedRecipeData`

The table row maps to `SavedRecipe`; the `recipe_data` JSONB blob maps to the nested `SavedRecipeData` struct.

**`SavedRecipe` column mapping:**

| DB column | Swift property | Swift type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Also exposed as `savedRecipeId: String` via computed property |
| `family_id` | `familyId` | `UUID` | Fully mapped |
| `recipe_data` | `recipeData` | `SavedRecipeData` | Fully mapped; decoded from JSONB |
| `is_favorite` | `isFavorite` | `Bool` | Fully mapped |
| `cuisine_style` | `cuisineStyle` | `String` | Fully mapped; note this is NOT nullable in Swift even though DB is nullable — decode will throw if null |
| `matched_count` | `matchedCount` | `Int` | Fully mapped |
| `total_count` | `totalCount` | `Int` | Fully mapped |
| `estimated_total_cost` | `estimatedTotalCost` | `Double?` | Custom decoder handles quoted-string from PostgREST |
| `created_at` | `createdAt` | `Date?` | Fully mapped |

**Fields not mapped in Swift model:** None. All columns are represented.

**`SavedRecipeData` JSONB key mapping:**

| JSON key | Swift property | Swift type |
|---|---|---|
| `name` | `name` | `String` |
| `cuisine_style` | `cuisineStyle` | `String` |
| `matched_count` | `matchedCount` | `Int` |
| `total_count` | `totalCount` | `Int` |
| `calories` | `calories` | `Int?` |
| `ingredients` | `ingredients` | `[RecipeIngredient]` |
| `steps` | `steps` | `[String]` |
| `missing_ingredients` | `missingIngredients` | `[MissingIngredient]` |

---

### 6.5 `shopping_list_items` → `ShoppingListItem`

| DB column | Swift property | Swift type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Fully mapped |
| `family_id` | `familyId` | `UUID` | Fully mapped |
| `name` | `name` | `String` | Fully mapped |
| `quantity` | `quantity` | `Double` | Custom decoder handles quoted-string from PostgREST |
| `unit` | `unit` | `String` | Fully mapped |
| `alternatives` | `alternatives` | `[String]` | Defaults to `[]` if absent |
| `is_purchased` | `isPurchased` | `Bool` | Fully mapped |
| `estimated_unit_cost` | `estimatedUnitCost` | `Double?` | Fully mapped |
| `recipe_name` | `recipeName` | `String?` | Fully mapped |
| `created_at` | — | — | **NOT mapped** in `ShoppingListItem` struct |
| `updated_at` | — | — | **NOT mapped** in `ShoppingListItem` struct |

**Fields not mapped in Swift model:** `created_at`, `updated_at`

---

### 6.6 API-Only Models (no corresponding DB table)

Two Swift models serve the external recipe API exclusively and have no direct Supabase table:

- **`RecipeRecommendation`** — response from `POST /api/recipes/recommend`; returned alongside a `saved_recipe_id` that references `saved_recipes.id`
- **`RecipeDetail`** — response from `GET /api/recipes/{id}`; fetched by `RecipeAPIService`

---

## 7. Known Gaps

### 7.1 `saved_recipes` UI is not implemented

The `saved_recipes` table has 25 rows and a full Swift model (`SavedRecipe`, `SavedRecipeData`), but there is no dedicated iOS view to browse or manage saved recipes. The `FoodIdeaView` / `RecipeDetailView` flow reads and writes to this table via `RecipeAPIService`, but there is no "My Saved Recipes" list screen. The `is_favorite` boolean is stored but never surfaced in any UI.

### 7.2 Duplicate `updated_at` triggers on three tables

`family_members`, `inventory_items`, and `shopping_list_items` each have two triggers that both fire on UPDATE and both write `updated_at = NOW()`:
- `*_updated_at` — uses the custom `update_updated_at()` function
- `handle_updated_at_*` — uses the Supabase-provided `moddatetime()` extension function

Both produce the same outcome but the duplication adds unnecessary overhead. One trigger per table should be removed.

### 7.3 `families.user_id` is NOT NULL in production but Optional in Swift

The DB constraint is `user_id NOT NULL`, yet `Family.userId` in Swift is declared `UUID?`. Any code path that treats `userId` as potentially absent is misleading. It should be `UUID` (non-optional) in Swift, or the DB column should be made nullable if there is a legitimate use-case for family rows with no owner.

### 7.4 `SavedRecipe.cuisineStyle` nullability mismatch

`saved_recipes.cuisine_style` is a nullable column in Postgres (`is_nullable = YES`), but `SavedRecipe.cuisineStyle` in Swift is a non-optional `String`. If a row is inserted with a `NULL` cuisine_style, decoding will throw a `DecodingError.valueNotFound` and the row will be silently dropped or crash the fetch. The Swift property should be `String?`, or the column should be given a NOT NULL constraint with a default.

### 7.5 No soft-delete or archiving mechanism

All five tables use hard deletes. There is no `deleted_at` column or archive table. If a family deletes an inventory item or a shopping list item, it is permanently removed with no audit trail.

### 7.6 `family_members` timestamps not decoded

`created_at` and `updated_at` exist on the `family_members` table but the `FamilyMember` Swift struct does not decode them. This is not a bug (the decoder silently ignores unknown keys), but it means the app cannot surface "member added on" information without a model update.

### 7.7 `inventory_items.added_at` vs `updated_at` confusion

`inventory_items` uses `added_at` (not `created_at`) as its insert-time column. The iOS `InventoryItem` struct does not map either timestamp. If the app ever needs to sort by "recently added", it must add `addedAt: Date?` to the Swift model and use `added_at` (not `created_at`) in the query.

### 7.8 No backend validation mirrors for CHECK constraints

The iOS app sends raw strings for `cooking_skill_level`, `budget_range`, `category`, and `spice_level`. If an out-of-range value is submitted (e.g. a new onboarding option before the DB constraint is updated), Postgres will reject the INSERT with a CHECK violation error. The app handles generic API errors but does not surface a user-friendly message for constraint violations specifically.

---

## 8. Live Query Reference

Run these queries in the Supabase SQL Editor (`dpgxcyktcptsnihpitjr`) to regenerate sections of this document.

```sql
-- Tables and columns
SELECT t.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- CHECK constraints
SELECT tc.table_name, tc.constraint_name, cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON cc.constraint_name = tc.constraint_name
WHERE tc.constraint_schema = 'public' ORDER BY tc.table_name;

-- Indexes
SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Functions
SELECT routine_name, routine_type, data_type, routine_definition
FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;

-- Row counts
SELECT relname AS tablename, n_live_tup AS row_count
FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname;
```
