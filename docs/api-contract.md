# SmartFridge — Full API Contract

**Last updated:** 2026-05-04  
**iOS app branch:** `ios-swift-app`  
**Supabase project:** `dpgxcyktcptsnihpitjr` (ap-southeast-1)  
**Custom backend base URL:** `https://api.hongkongtech.org`

---

## Architecture Overview

The iOS app communicates with **two distinct backends**:

| Layer | Base URL | Auth | Purpose |
|-------|----------|------|---------|
| **Custom Backend API** | `https://api.hongkongtech.org` | `Authorization: Bearer <supabase_jwt>` | AI features: image scan, recipe generation |
| **Supabase PostgREST** | `https://dpgxcyktcptsnihpitjr.supabase.co` | Supabase anon key + JWT (via Swift SDK) | All CRUD, auth, realtime |

All `Authorization: Bearer` tokens are Supabase JWT access tokens obtained via `client.auth.session.accessToken`. The custom backend **must** validate these tokens against Supabase before processing any request.

---

## Part 1 — Custom Backend API (`api.hongkongtech.org`)

### Authentication (all endpoints)

Every request includes:
```
Authorization: Bearer <supabase_access_token>
```
The backend must verify this token with Supabase Auth before executing. If invalid/expired → `401 Unauthorized`.

---

### 1.1 — `POST /api/inventory/initialize`

**Purpose:** Accept one or more fridge photos, detect food items using AI, write detected items to `inventory_items` in Supabase, and return the written items.

**Request format:** `multipart/form-data`

| Part | Field name | Type | Required | Notes |
|------|------------|------|----------|-------|
| File part(s) | `images` | `image/jpeg` | Yes (1–3) | JPEG, max ~1024×1024px, ~60% quality. Client resizes before upload. |
| Text part | `family_id` | `string` (UUID) | Yes | e.g. `"550e8400-e29b-41d4-a716-446655440000"` |

**Headers:**
```
Content-Type: multipart/form-data; boundary=<uuid>
Authorization: Bearer <token>
```

**Success Response:** `200 OK`  
`Content-Type: application/json`

```json
[
  {
    "id": "uuid",
    "family_id": "uuid",
    "name": "Milk",
    "category": "dairy",
    "quantity": 1.0,
    "unit": "litre",
    "expiry_date": "2026-05-10"
  }
]
```

> **Important:** The backend writes directly to Supabase `inventory_items`. The iOS app then calls `SupabaseService.fetchInventory()` to refresh — it does NOT use the returned array directly to populate state.

**Response field requirements:**

| Field | Type | Nullable | Constraints |
|-------|------|----------|-------------|
| `id` | string (UUID) | No | Must match the row written to Supabase |
| `family_id` | string (UUID) | No | Must equal the `family_id` sent in the request |
| `name` | string | No | Non-empty, trimmed |
| `category` | string | No | One of: `produce`, `dairy`, `meat`, `seafood`, `frozen`, `pantry`, `beverages`, `other` |
| `quantity` | number **or** string | No | `> 0`. PostgREST returns `numeric` as quoted string; backend may return raw number. iOS handles both. |
| `unit` | string | No (default `""`) | e.g. `"kg"`, `"pcs"`, `"litre"` |
| `expiry_date` | string | Yes | `"YYYY-MM-DD"` format (date-only). iOS parses with `DateFormatter(format: "yyyy-MM-dd")`. |

**Error responses:**
```json
{ "error": "description" }
```
| Status | Meaning |
|--------|---------|
| `400` | No images provided, invalid family_id, or image processing failed |
| `401` | JWT invalid or expired |
| `403` | JWT valid but family does not belong to auth.uid() (RLS would reject the write) |
| `422` | No food items could be detected in the provided images |
| `500` | AI service error or Supabase write failure |

**Client timeout:** 120 seconds (scan can be slow)

---

### 1.2 — `POST /api/recipes/recommend`

**Purpose:** Given a family's inventory (looked up by `family_id`), selected member preferences (by `member_ids`), and a cuisine filter, generate and return a list of recipe recommendations. Each recipe is also persisted to `saved_recipes` in Supabase.

**Request format:** `application/json`

```json
{
  "family_id": "uuid",
  "member_ids": ["uuid", "uuid"],
  "cuisine_style": "Chinese"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `family_id` | string (UUID) | Yes | |
| `member_ids` | array of string (UUID) | Yes | Empty array = use all family members |
| `cuisine_style` | string | Yes | Free text. Common values from iOS picker — see Constants |

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Success Response:** `200 OK`

The iOS app accepts **either** a wrapped or flat format:

```json
{
  "recipes": [
    {
      "saved_recipe_id": "uuid-string",
      "name": "Stir-fried Tomato and Egg",
      "cuisine_style": "Chinese",
      "matched_count": 3,
      "total_count": 5,
      "missing_count": 2,
      "calories": 320
    }
  ]
}
```

Or flat (no wrapper object):
```json
[
  { "saved_recipe_id": "...", ... }
]
```

**Response field requirements (each recipe object):**

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `saved_recipe_id` | string (UUID) | No | Must be the `id` of the row written to `saved_recipes`. iOS uses this as stable `Identifiable.id` across re-fetches. Do NOT generate a new UUID on every call for the same recipe. |
| `name` | string | No | |
| `cuisine_style` | string | No | Should match the requested `cuisine_style` |
| `matched_count` | integer | No | How many required ingredients the family already has |
| `total_count` | integer | No | Total required ingredients for the recipe |
| `missing_count` | integer | No | `total_count - matched_count` |
| `calories` | integer | Yes | Per-serving estimate. iOS shows `~X kcal` if present. |

**Backend must also write each recipe to `saved_recipes`:**
```sql
INSERT INTO saved_recipes (id, family_id, recipe_data, is_favorite, cuisine_style, matched_count, total_count, estimated_total_cost)
VALUES (...);
```
The `saved_recipe_id` returned to iOS must be the `id` of this row.

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | JWT invalid |
| `404` | Family not found or inventory empty |
| `500` | AI generation failed |

**Client timeout:** 90 seconds

---

### 1.3 — `GET /api/recipes/{id}?family_id={uuid}`

**Purpose:** Fetch full details for a previously generated recipe (steps, ingredients, missing items). `{id}` is the `saved_recipe_id` (UUID string) returned by `/api/recipes/recommend`.

**URL parameters:**
| Param | Location | Type | Required | Notes |
|-------|----------|------|----------|-------|
| `id` | path | string (UUID) | Yes | The `saved_recipe_id` from the recommendation list |
| `family_id` | query | string (UUID) | Yes | Used to compute `missing_ingredients` against current inventory |

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:** `200 OK`

The iOS app accepts **either** a wrapped or flat format:

```json
{
  "recipe": {
    "saved_recipe_id": "uuid-string",
    "name": "Stir-fried Tomato and Egg",
    "cuisine_style": "Chinese",
    "matched_count": 3,
    "total_count": 5,
    "calories": 320,
    "ingredients": [
      {
        "name": "egg",
        "quantity": 3.0,
        "unit": "pcs",
        "required": true
      }
    ],
    "steps": [
      "Heat oil in wok over high heat.",
      "Beat eggs and season with salt."
    ],
    "missing_ingredients": [
      {
        "name": "tomato",
        "quantity": 2.0,
        "unit": "pcs",
        "alternatives": ["canned tomato", "tomato paste"]
      }
    ]
  }
}
```

Or flat (no `"recipe"` wrapper key):
```json
{ "saved_recipe_id": "...", "name": "...", ... }
```

**Response field requirements:**

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `saved_recipe_id` | string (UUID) | No | Same value as the `id` path param |
| `name` | string | No | |
| `cuisine_style` | string | No | |
| `matched_count` | integer | No | |
| `total_count` | integer | No | |
| `calories` | integer | Yes | |
| `ingredients` | array | No | Each item: `name`, `quantity` (number), `unit` (string), `required` (bool) |
| `steps` | array of string | No | Ordered cooking instructions |
| `missing_ingredients` | array | No | Each item: `name`, `quantity` (number), `unit` (string), `alternatives` (array of string) |

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | JWT invalid |
| `404` | Recipe not found for this family |

**Client timeout:** 30 seconds

---

### 1.4 — `POST /api/recipes/{id}/add-to-shopping-list`

**Purpose:** Add the missing ingredients of recipe `{id}` to the family's `shopping_list_items` in Supabase.

**URL parameters:**
| Param | Location | Type | Required |
|-------|----------|------|----------|
| `id` | path | string (UUID) | Yes |

**Request format:** `application/json`

```json
{
  "family_id": "uuid"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Success Response:** `200 OK` or `204 No Content`

Body is ignored by iOS client.

**Backend must write to `shopping_list_items`:**
```sql
INSERT INTO shopping_list_items (id, family_id, name, quantity, unit, is_purchased, estimated_unit_cost, alternatives, recipe_name)
VALUES (...);
```

Each missing ingredient from the recipe becomes one row. `recipe_name` should be set to the recipe name so the iOS shopping list can group by recipe.

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | JWT invalid |
| `404` | Recipe not found |
| `409` | Items already in shopping list (optional — iOS ignores body) |

**Client timeout:** 30 seconds

---

## Part 2 — Supabase PostgREST (iOS Swift SDK direct calls)

All calls go through the Supabase Swift SDK. Base URL: `https://dpgxcyktcptsnihpitjr.supabase.co`. The anon key is set in `Config.supabaseAnonKey`. RLS enforces per-user isolation on all tables.

### 2.1 — Auth

| Operation | SDK call | Notes |
|-----------|----------|-------|
| Send phone OTP | `client.auth.signInWithOTP(phone:)` | Phone format: `+852XXXXXXXX` |
| Verify OTP | `client.auth.verifyOTP(phone:token:type:.sms)` | Returns `AuthResponse` |
| Sign out | `client.auth.signOut()` | Clears local session |
| Get access token | `client.auth.session.accessToken` | Used as Bearer token for custom backend |
| Get current user id | `client.auth.currentUser?.id` | `UUID?` — nil before first auth event |

---

### 2.2 — `families` table

| Operation | Filter | Notes |
|-----------|--------|-------|
| `SELECT` by id | `eq("id", value: uuid)` | Used for direct lookup |
| `SELECT` by user | `eq("user_id", value: userId)` | Used on app launch to find the family |
| `UPSERT` | `onConflict: "id"` | Always includes `user_id = auth.uid()` |

**Expected write shape (upsert):**
```json
{
  "id": "uuid",
  "name": "string",
  "cooking_skill_level": "beginner|intermediate|advanced",
  "budget_range": "low|medium|high",
  "preferred_language": "en|zh-HK|fil|id",
  "user_id": "uuid"
}
```

---

### 2.3 — `family_members` table

| Operation | Filter | Notes |
|-----------|--------|-------|
| `SELECT` | `eq("family_id", value: uuid)` | Returns all members for the family |
| `UPSERT` | `onConflict: "id"` | Single member |
| `UPSERT` (batch) | `onConflict: "id"` | Array of members — one round-trip |
| `DELETE` | `eq("id", value: uuid)` | |

**Expected write shape:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "age": 30,
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "health_conditions": [],
  "spice_level": "medium|mild|hot|extra_hot",
  "favorite_cuisines": ["Chinese", "Japanese"],
  "disliked_ingredients": ["cilantro"]
}
```

Array fields omitted from write when empty (not sent as `[]`).

---

### 2.4 — `inventory_items` table

| Operation | Filter | Notes |
|-----------|--------|-------|
| `SELECT` | `eq("family_id", value: uuid)` | Full inventory load |
| `INSERT` | — | Single item |
| `UPDATE` | `eq("id", value: uuid)` | Single item |
| `DELETE` | `eq("id", value: uuid)` | Single item |

**Expected write shape:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "category": "produce|dairy|meat|seafood|frozen|pantry|beverages|other",
  "quantity": 1.5,
  "unit": "kg",
  "expiry_date": "2026-05-20"
}
```

`expiry_date` is a `date` column — write as `"YYYY-MM-DD"` string. PostgREST returns it as `"YYYY-MM-DD"` (not ISO8601 datetime). iOS has a custom DateFormatter for this.

`quantity` is a `numeric` column — PostgREST returns it as a quoted string `"1.50"`. iOS decodes both `Double` and `String` for compatibility.

---

### 2.5 — `shopping_list_items` table

| Operation | Filter | Notes |
|-----------|--------|-------|
| `SELECT` | `eq("family_id", value: uuid)` | Full list load |
| `INSERT` (array) | — | Multiple items at once |
| `UPDATE` | `eq("id", value: uuid)` | Used for toggle purchased |
| `DELETE` (array) | `.in("id", values: [uuid strings])` | Used for "Clear Bought" and single-item delete |

**Expected write shape:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "quantity": 2.0,
  "unit": "pcs",
  "is_purchased": false,
  "estimated_unit_cost": 12.50,
  "alternatives": ["option A", "option B"],
  "recipe_name": "Stir-fried Tomato and Egg"
}
```

`estimated_unit_cost` is `numeric` — PostgREST returns as quoted string. `recipe_name` is used for grouping in the shopping list UI.

---

### 2.6 — `saved_recipes` table

| Operation | Filter | Notes |
|-----------|--------|-------|
| `SELECT` | `eq("family_id", value: uuid)`, `order("created_at", ascending: false)` | All saved recipes, newest first |
| `UPDATE` | `eq("id", value: uuid)` | Toggle `is_favorite` only |

**Written by the custom backend only.** iOS does not INSERT to this table directly.

**Read shape returned to iOS:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "recipe_data": {
    "name": "string",
    "cuisine_style": "string",
    "ingredients": [{ "name": "egg", "quantity": 3.0, "unit": "pcs", "required": true }],
    "steps": ["string"],
    "missing_ingredients": [{ "name": "tomato", "quantity": 2.0, "unit": "pcs", "alternatives": [] }],
    "matched_count": 3,
    "total_count": 5,
    "calories": 320
  },
  "is_favorite": false,
  "created_at": "2026-05-04T10:00:00Z",
  "cuisine_style": "Chinese",
  "matched_count": 3,
  "total_count": 5,
  "estimated_total_cost": "45.00"
}
```

`cuisine_style` at the top level is **nullable** — some rows may be `null`. iOS handles this as `String?`.  
`estimated_total_cost` is `numeric` — returned as quoted string. iOS dual-decodes.

---

## Part 3 — Supabase Realtime Subscriptions

Three channels are opened after successful sign-in. Each uses `onPostgresChange(AnyAction.self, ...)` which triggers on any INSERT/UPDATE/DELETE to the filtered table.

| Channel name | Table | Filter | On event |
|-------------|-------|--------|----------|
| `family_members:{familyId}` | `family_members` | `family_id=eq.{uuid}` | Re-fetch all members |
| `inventory_items:{familyId}` | `inventory_items` | `family_id=eq.{uuid}` | Re-fetch all inventory items |
| `shopping_list_items:{familyId}` | `shopping_list_items` | `family_id=eq.{uuid}` | Re-fetch full shopping list |

All channels use the re-fetch-on-change pattern (not streaming diffs). Subscription errors are logged in `#if DEBUG` but do not surface to the user.

Channels are unsubscribed on sign-out. `ShoppingViewModel` unsubscribes when `familyId` becomes `nil`.

---

## Part 4 — Alignment Gaps & Open Questions

### Gap 1: `saved_recipe_id` stability
The custom backend must return a **stable, persistent** `saved_recipe_id` for each recipe. This is the `id` UUID of the row in `saved_recipes`. iOS uses this as `Identifiable.id` — if you return a new UUID for the same recipe on a second recommendation call, SwiftUI will re-animate all cards and the detail view will break navigation.

**Recommendation:** Look up the recipe in `saved_recipes` by `(family_id, recipe hash or name)` before inserting. If it already exists, return the existing `id`.

### Gap 2: Backend JWT validation
The backend at `api.hongkongtech.org` must validate the Supabase JWT on every request. The recommended approach:
```python
# Python/FastAPI example
from supabase import create_client
client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
user = client.auth.get_user(bearer_token)  # throws if invalid
```
If the backend uses the **service role key** to write to `saved_recipes` and `shopping_list_items`, RLS is bypassed. This means the backend must enforce `family_id` ownership itself.

### Gap 3: `add-to-shopping-list` de-duplication
When the user taps "Add to Shopping List" twice for the same recipe, the backend would insert duplicate rows. The `shopping_list_items` table has a unique constraint `shopping_list_items_family_name_recipe_key` — check if this applies here and handle the `409 Conflict` or upsert on `(family_id, name, recipe_name)`.

### Gap 4: No Supabase Edge Functions
Currently all AI logic lives on `api.hongkongtech.org`. If you ever want to move to Edge Functions, each endpoint maps 1:1:

| Current endpoint | Potential Edge Function name |
|-----------------|------------------------------|
| `POST /api/inventory/initialize` | `inventory-scan` |
| `POST /api/recipes/recommend` | `recipe-recommend` |
| `GET /api/recipes/{id}` | `recipe-detail` |
| `POST /api/recipes/{id}/add-to-shopping-list` | `recipe-add-to-list` |

Edge Functions receive the JWT automatically via `Authorization` header and can access the Supabase DB via the service client with full trust. Migration is optional — the current architecture is fine as long as `api.hongkongtech.org` stays live and has HTTPS.

---

## Part 5 — iOS Config Requirements

The following values must be set in the Xcode build configuration (xcconfig or build settings) and referenced via `Info.plist`:

| Info.plist key | xcconfig var | Value |
|----------------|-------------|-------|
| `API_BASE_URL` | `API_BASE_URL` | `https://api.hongkongtech.org` |
| `SUPABASE_URL` | `SUPABASE_URL` | `https://dpgxcyktcptsnihpitjr.supabase.co` |
| `SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | (from Supabase dashboard → Project Settings → API) |

`API_BASE_URL` must use `https://`. The `NSAppTransportSecurity` exception for the old bare IP (`152.42.221.192`) should be **removed** once `api.hongkongtech.org` has a valid TLS certificate.
