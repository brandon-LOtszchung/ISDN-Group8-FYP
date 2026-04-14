# Recipe Reference Energy Intake (kcal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a per-serving kcal estimate on every recipe card and recipe detail view in the iOS app and the interactive HTML demo.

**Architecture:** Add optional `calories: Int?` to `RecipeRecommendation` and `RecipeDetail` so a future API-supplied value wins automatically. A new `RecipeCalories` utility holds a name-keyed dictionary as the fallback. Views read `recipe.calories ?? RecipeCalories.estimate(for: recipe.name)`.

**Tech Stack:** Swift 5.9, SwiftUI, XCTest, vanilla JS/HTML

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `SmartFridge/SmartFridge/Models/Models.swift` | Add `calories: Int?` to `RecipeRecommendation` and `RecipeDetail` |
| Create | `SmartFridge/SmartFridge/Utils/RecipeCalories.swift` | Static lookup table + `estimate(for:)` |
| Create | `SmartFridge/SmartFridgeTests/RecipeCaloriesTests.swift` | Unit tests for lookup utility |
| Modify | `SmartFridge/SmartFridgeTests/ModelTests.swift` | Extend existing decode tests to cover `calories` |
| Modify | `SmartFridge/SmartFridge/Views/Planning/FoodIdeaView.swift` | kcal line in `RecipeCardView` |
| Modify | `SmartFridge/SmartFridge/Views/Planning/RecipeDetailView.swift` | kcal info pill |
| Modify | `smartfridge-interactive.html` | Add `kcal` to `RECIPES`, flame icon, card badge, detail pill |

---

### Task 1: Add `calories` field to models and extend model decode tests

**Files:**
- Modify: `SmartFridge/SmartFridge/Models/Models.swift`
- Modify: `SmartFridge/SmartFridgeTests/ModelTests.swift`

- [ ] **Step 1: Add `calories: Int?` to both recipe models**

In `SmartFridge/SmartFridge/Models/Models.swift`, update the two recipe structs:

```swift
/// Returned by POST /api/recipes/recommend
struct RecipeRecommendation: Codable, Identifiable {
    var id: String { savedRecipeId }
    var savedRecipeId: String
    var name: String
    var cuisineStyle: String
    var matchedCount: Int
    var totalCount: Int
    var missingCount: Int
    var calories: Int?          // decoded from API when present; nil otherwise
}

/// Returned by GET /api/recipes/{id}
struct RecipeDetail: Codable {
    var savedRecipeId: String
    var name: String
    var cuisineStyle: String
    var matchedCount: Int
    var totalCount: Int
    var ingredients: [RecipeIngredient]
    var steps: [String]
    var missingIngredients: [MissingIngredient]
    var calories: Int?          // decoded from API when present; nil otherwise
}
```

- [ ] **Step 2: Add decode tests to `ModelTests.swift`**

Add two new test methods to the existing `ModelTests` class:

```swift
func testRecipeRecommendationCaloriesNilWhenAbsent() throws {
    let json = """
    {
      "saved_recipe_id": "abc123",
      "name": "Broccoli Beef",
      "cuisine_style": "Chinese",
      "matched_count": 5,
      "total_count": 7,
      "missing_count": 2
    }
    """.data(using: .utf8)!
    let rec = try decoder.decode(RecipeRecommendation.self, from: json)
    XCTAssertNil(rec.calories, "calories must be nil when the API omits the field")
}

func testRecipeRecommendationCaloriesDecodedWhenPresent() throws {
    let json = """
    {
      "saved_recipe_id": "def456",
      "name": "Teriyaki Salmon",
      "cuisine_style": "Japanese",
      "matched_count": 4,
      "total_count": 6,
      "missing_count": 2,
      "calories": 350
    }
    """.data(using: .utf8)!
    let rec = try decoder.decode(RecipeRecommendation.self, from: json)
    XCTAssertEqual(rec.calories, 350)
}
```

- [ ] **Step 3: Run the model tests to confirm they pass**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodegen generate
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/ModelTests 2>&1 | tail -20
```

Expected: `** TEST SUCCEEDED **` (all 5 tests pass, including the 2 new ones).

- [ ] **Step 4: Commit**

```bash
git add SmartFridge/SmartFridge/Models/Models.swift \
        SmartFridge/SmartFridgeTests/ModelTests.swift
git commit -m "feat(ios): add optional calories field to recipe models"
```

---

### Task 2: Create `RecipeCalories` utility and its tests

**Files:**
- Create: `SmartFridge/SmartFridge/Utils/RecipeCalories.swift`
- Create: `SmartFridge/SmartFridgeTests/RecipeCaloriesTests.swift`

- [ ] **Step 1: Write the failing tests first**

Create `SmartFridge/SmartFridgeTests/RecipeCaloriesTests.swift`:

```swift
// SmartFridgeTests/RecipeCaloriesTests.swift
import XCTest
@testable import SmartFridge

final class RecipeCaloriesTests: XCTestCase {

    func test_knownRecipe_exactCase() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Steamed Chicken with Ginger"), 320)
    }

    func test_knownRecipe_uppercased() {
        XCTAssertEqual(RecipeCalories.estimate(for: "MAPO TOFU"), 380)
    }

    func test_knownRecipe_mixedCase() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Garlic Fried Rice"), 410)
    }

    func test_knownRecipe_zeroCal() {
        XCTAssertEqual(RecipeCalories.estimate(for: "Bok Choy with Oyster Sauce"), 95)
    }

    func test_unknownRecipe_returnsNil() {
        XCTAssertNil(RecipeCalories.estimate(for: "Unknown Mystery Dish"))
    }

    func test_emptyString_returnsNil() {
        XCTAssertNil(RecipeCalories.estimate(for: ""))
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail (RecipeCalories not yet defined)**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/RecipeCaloriesTests 2>&1 | tail -20
```

Expected: build error — `cannot find type 'RecipeCalories' in scope`.

- [ ] **Step 3: Create `RecipeCalories.swift`**

Create `SmartFridge/SmartFridge/Utils/RecipeCalories.swift`:

```swift
// Utils/RecipeCalories.swift

/// Local kcal-per-serving estimates keyed by recipe name.
/// Acts as a fallback when the API does not return a `calories` field.
/// Real API data always takes precedence — see views for resolution order.
enum RecipeCalories {

    /// Estimated kcal per serving, keyed by lowercase recipe name.
    private static let table: [String: Int] = [
        "steamed chicken with ginger":  320,
        "bok choy with oyster sauce":    95,
        "mapo tofu":                    380,
        "garlic fried rice":            410,
        "teriyaki salmon":              350,
        "bibimbap":                     490,
        "chicken adobo":                430,
        "nasi goreng":                  520,
    ]

    /// Returns the estimated kcal per serving for the given recipe name,
    /// or `nil` if the name is not in the local table.
    /// Lookup is case-insensitive.
    static func estimate(for name: String) -> Int? {
        table[name.lowercased()]
    }
}
```

- [ ] **Step 4: Run tests again to confirm they pass**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/RecipeCaloriesTests 2>&1 | tail -20
```

Expected: `** TEST SUCCEEDED **` (all 6 tests pass).

- [ ] **Step 5: Commit**

```bash
git add SmartFridge/SmartFridge/Utils/RecipeCalories.swift \
        SmartFridge/SmartFridgeTests/RecipeCaloriesTests.swift
git commit -m "feat(ios): add RecipeCalories utility with per-serving kcal lookup table"
```

---

### Task 3: Show kcal on the recipe card (`FoodIdeaView`)

**Files:**
- Modify: `SmartFridge/SmartFridge/Views/Planning/FoodIdeaView.swift`

- [ ] **Step 1: Add kcal line to `RecipeCardView`**

In `FoodIdeaView.swift`, locate the `RecipeCardView` body. The card currently ends with:

```swift
Text("\(recommendation.missingCount) missing")
    .font(.caption)
    .foregroundStyle(recommendation.missingCount == 0 ? theme.colors.success : theme.colors.danger)
```

Replace that block with:

```swift
Text("\(recommendation.missingCount) missing")
    .font(.caption)
    .foregroundStyle(recommendation.missingCount == 0 ? theme.colors.success : theme.colors.danger)
if let kcal = recommendation.calories ?? RecipeCalories.estimate(for: recommendation.name) {
    Label("~\(kcal) kcal", systemImage: "flame")
        .font(.caption)
        .foregroundStyle(.orange)
}
```

- [ ] **Step 2: Build to verify no compile errors**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodebuild build -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -10
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Commit**

```bash
git add SmartFridge/SmartFridge/Views/Planning/FoodIdeaView.swift
git commit -m "feat(ios): show kcal estimate on recipe cards in food ideas screen"
```

---

### Task 4: Show kcal as an info pill in the recipe detail view

**Files:**
- Modify: `SmartFridge/SmartFridge/Views/Planning/RecipeDetailView.swift`

- [ ] **Step 1: Add kcal pill to the info pill row**

In `RecipeDetailView.swift`, locate the info pills `HStack`:

```swift
HStack {
    infoPill(recommendation.cuisineStyle, icon: "fork.knife")
    infoPill("\(recommendation.matchPercentage)% match", icon: "checkmark.circle")
    infoPill("\(recommendation.missingCount) missing", icon: "cart.badge.plus")
}
```

Replace with:

```swift
HStack {
    infoPill(recommendation.cuisineStyle, icon: "fork.knife")
    infoPill("\(recommendation.matchPercentage)% match", icon: "checkmark.circle")
    infoPill("\(recommendation.missingCount) missing", icon: "cart.badge.plus")
    if let kcal = recommendation.calories ?? RecipeCalories.estimate(for: recommendation.name) {
        infoPill("~\(kcal) kcal", icon: "flame")
    }
}
```

- [ ] **Step 2: Build to verify no compile errors**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodebuild build -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -10
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Run the full test suite**

```bash
cd /home/system/derppening/ISDN-Group8-FYP/SmartFridge
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -20
```

Expected: `** TEST SUCCEEDED **`

- [ ] **Step 4: Commit**

```bash
git add SmartFridge/SmartFridge/Views/Planning/RecipeDetailView.swift
git commit -m "feat(ios): show kcal info pill in recipe detail view"
```

---

### Task 5: Update the interactive HTML demo

**Files:**
- Modify: `smartfridge-interactive.html`

- [ ] **Step 1: Add a `flame` SVG icon to the `IC` object**

In `smartfridge-interactive.html`, find the `IC` constant (around line 1011). Add a `flame` entry after the `plus` entry:

```js
  plus:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  flame: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0c0-2.5-1.5-5-3-7-1 2-2 3-2 5a2 2 0 0 1-4 0c0-3 4-8 4-8z"/></svg>`,
};
```

- [ ] **Step 2: Add `kcal` property to each recipe in the `RECIPES` array**

Each recipe object currently ends its first line with `match:NN,`. Add `kcal:NNN,` on the same line. The values to use:

| id | name | kcal |
|----|------|------|
| r1 | Steamed Chicken with Ginger | 320 |
| r2 | Bok Choy with Oyster Sauce | 95 |
| r3 | Mapo Tofu | 380 |
| r4 | Garlic Fried Rice | 410 |
| r5 | Teriyaki Salmon | 350 |
| r6 | Bibimbap | 490 |
| r7 | Chicken Adobo | 430 |
| r8 | Nasi Goreng | 520 |

Make these replacements (example for r1 — repeat for all 8):

Old:
```js
{ id:'r1', name:'Steamed Chicken with Ginger', cuisine:'Cantonese', match:85,
```
New:
```js
{ id:'r1', name:'Steamed Chicken with Ginger', cuisine:'Cantonese', match:85, kcal:320,
```

- [ ] **Step 3: Add kcal badge to `renderRecipeList`**

In `renderRecipeList`, the card body currently ends with:

```js
        <div style="font-size:12px;margin-top:4px;color:${missingCount===0?'var(--success)':'var(--danger)'}">
          ${STRINGS[S.lang]['planning.missing'](missingCount)}
        </div>
```

Replace with:

```js
        <div style="font-size:12px;margin-top:4px;color:${missingCount===0?'var(--success)':'var(--danger)'}">
          ${STRINGS[S.lang]['planning.missing'](missingCount)}
        </div>
        ${r.kcal != null ? `<div style="font-size:12px;margin-top:2px;color:#FF9500;display:flex;align-items:center;gap:3px">${IC.flame}&nbsp;~${r.kcal} kcal</div>` : ''}
```

- [ ] **Step 4: Add kcal pill to `renderDetail`**

In `renderDetail`, the pills row currently reads:

```js
          <span class="ipill">${IC.forkKnife}&nbsp;${r.cuisine}</span>
          <span class="ipill">${IC.checkCircle}&nbsp;${r.match}% ${t('recipe.match')}</span>
          <span class="ipill">${IC.cartPlus}&nbsp;${STRINGS[S.lang]['planning.missing'](missing.length)}</span>
```

Replace with:

```js
          <span class="ipill">${IC.forkKnife}&nbsp;${r.cuisine}</span>
          <span class="ipill">${IC.checkCircle}&nbsp;${r.match}% ${t('recipe.match')}</span>
          <span class="ipill">${IC.cartPlus}&nbsp;${STRINGS[S.lang]['planning.missing'](missing.length)}</span>
          ${r.kcal != null ? `<span class="ipill" style="color:#FF9500">${IC.flame}&nbsp;~${r.kcal} kcal</span>` : ''}
```

- [ ] **Step 5: Open the HTML in a browser and verify**

Open `smartfridge-interactive.html` in a browser. Navigate to the Plan tab, select a member + cuisine, tap "Get Ideas". Confirm:
- Each recipe card shows a flame icon + `~NNN kcal` line in orange below the missing count.
- Tapping a recipe opens the detail; the pill row shows a `~NNN kcal` orange pill.

- [ ] **Step 6: Commit**

```bash
git add smartfridge-interactive.html
git commit -m "feat: add kcal estimate to recipe cards and detail in interactive demo"
```
