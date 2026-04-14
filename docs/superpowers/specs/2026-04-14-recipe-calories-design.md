# Recipe Reference Energy Intake (kcal) — Design Spec

**Date:** 2026-04-14
**Status:** Approved
**Scope:** iOS app + interactive HTML demo

---

## Overview

Add a reference energy intake value (kcal) to each recipe on the Food Ideas screen. The value is displayed on both the recipe card (list view) and the recipe detail view. Data comes from a local name-keyed dictionary for now; the model is designed so a future API-supplied `calories` field wins automatically without touching the views.

---

## Data Layer

### `Models.swift`

Add `var calories: Int?` to both `RecipeRecommendation` and `RecipeDetail`:

```swift
struct RecipeRecommendation: Codable, Identifiable {
    // existing fields …
    var calories: Int?          // NEW — decoded from API when present
}

struct RecipeDetail: Codable {
    // existing fields …
    var calories: Int?          // NEW — decoded from API when present
}
```

The existing `JSONDecoder` uses `.convertFromSnakeCase`, so a future API response field named `calories` (or `calories`) is decoded automatically. The field is optional so decoding succeeds today when the API omits it.

### `Utilities/RecipeCalories.swift` (new file)

A self-contained lookup table isolated from the models and views.

```swift
enum RecipeCalories {
    /// Estimated kcal per serving, keyed by canonical recipe name (case-insensitive).
    static let table: [String: Int] = [
        "steamed chicken with ginger": 320,
        "bok choy with oyster sauce":  95,
        "mapo tofu":                   380,
        "garlic fried rice":           410,
        "teriyaki salmon":             350,
        "bibimbap":                    490,
        "chicken adobo":               430,
        "nasi goreng":                 520,
    ]

    /// Returns the estimated kcal for a recipe name, or nil if unknown.
    static func estimate(for name: String) -> Int? {
        table[name.lowercased()]
    }
}
```

**Lookup resolution order in views:**
```swift
let kcal: Int? = recipe.calories ?? RecipeCalories.estimate(for: recipe.name)
```

Real API data wins when present; the dictionary serves as the fallback.

---

## UI — iOS

### Recipe Card (`FoodIdeaView` → `RecipeCardView`)

Add a kcal line below the existing missing-count line inside the card's `VStack`:

- SF Symbol: `flame` tinted `.orange`
- Text: `"~\(kcal) kcal"` or `"-- kcal"` when value is unavailable
- Font: `.caption` / `.secondary` — same visual weight as the missing-count line

### Recipe Detail (`RecipeDetailView`)

Add a fourth info pill in the horizontal scrolling pill row:

- Icon: `flame` SF Symbol
- Label: `"~\(kcal) kcal"`
- Style: same `infoPill(_:icon:)` helper already used for cuisine / match / missing

If `kcal` is nil (unknown recipe with no API value), the pill is omitted entirely rather than showing a placeholder.

---

## UI — Interactive HTML Demo

### `RECIPES` array

Add a `kcal` integer property to each recipe object, using the same estimates as the Swift lookup table.

### Card rendering

Render a small `🔥 ~X kcal` badge on each recipe card alongside the existing match percentage.

### Detail panel

Render a pill/chip in the detail info row alongside cuisine, match %, and missing count.

---

## Non-Goals

- No new localisation string keys — "kcal" is a universally recognised unit suffix.
- No per-ingredient calorie breakdown.
- No total-recipe calorie calculation (value represents a per-serving estimate).
- No server-side changes.

---

## Future Upgrade Path

When the API begins returning `calories`, no view code changes are required. The only change needed is removing `RecipeCalories.swift` (or leaving it as a fallback) once all live recipes carry the field.
