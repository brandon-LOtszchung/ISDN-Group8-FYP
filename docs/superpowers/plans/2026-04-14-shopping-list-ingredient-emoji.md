# Shopping List Ingredient Emoji Icons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a food emoji icon beside each item row in the iOS shopping list screen for quick visual scanning.

**Architecture:** A new `IngredientEmoji` utility struct maps ingredient names to emojis via keyword matching (longest-match-first, case-insensitive substring). `ShoppingItemRow` in `ShoppingListView.swift` gains a small emoji `Text` view in a rounded-rect container between the checkmark and item name. No model or backend changes.

**Tech Stack:** Swift 5.9, SwiftUI, XCTest, xcodegen

---

## File Map

| Action | Path |
|--------|------|
| Create | `SmartFridge/SmartFridge/Utils/IngredientEmoji.swift` |
| Create | `SmartFridge/SmartFridgeTests/IngredientEmojiTests.swift` |
| Modify | `SmartFridge/SmartFridge/Views/Shopping/ShoppingListView.swift` |

---

## Task 1: `IngredientEmoji` utility — tests + implementation

**Files:**
- Create: `SmartFridge/SmartFridge/Utils/IngredientEmoji.swift`
- Create: `SmartFridge/SmartFridgeTests/IngredientEmojiTests.swift`

- [ ] **Step 1: Create the test file**

```swift
// SmartFridgeTests/IngredientEmojiTests.swift
import XCTest
@testable import SmartFridge

final class IngredientEmojiTests: XCTestCase {

    func test_exactMatch_carrot() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Carrot"), "🥕")
    }

    func test_exactMatch_egg() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Egg"), "🥚")
    }

    func test_exactMatch_milk() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Milk"), "🥛")
    }

    func test_caseInsensitive_uppercase() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "CHICKEN"), "🍗")
    }

    func test_caseInsensitive_mixed() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Fresh Carrots"), "🥕")
    }

    func test_substringMatch_withQualifier() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Organic Broccoli"), "🥦")
    }

    func test_specificBeforeGeneral_springOnion() {
        // "spring onion" is more specific than "onion" — must match 🌿, not 🧅
        XCTAssertEqual(IngredientEmoji.emoji(for: "Spring Onion"), "🌿")
    }

    func test_specificBeforeGeneral_oysteSauce() {
        // "oyster sauce" must match 🫙, not "oyster" → 🦪
        XCTAssertEqual(IngredientEmoji.emoji(for: "Oyster Sauce"), "🫙")
    }

    func test_unknownIngredient_fallback() {
        XCTAssertEqual(IngredientEmoji.emoji(for: "Xyzzy"), "🛒")
    }

    func test_emptyString_fallback() {
        XCTAssertEqual(IngredientEmoji.emoji(for: ""), "🛒")
    }
}
```

- [ ] **Step 2: Regenerate .xcodeproj so Xcode picks up the new test file**

```bash
cd SmartFridge && xcodegen generate
```

Expected: `Generating project SmartFridge` with no errors.

- [ ] **Step 3: Run tests to verify they all fail**

```bash
cd SmartFridge && xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/IngredientEmojiTests 2>&1 | tail -20
```

Expected: compilation error — `IngredientEmoji` not found.

- [ ] **Step 4: Create the implementation file**

```swift
// SmartFridge/Utils/IngredientEmoji.swift
struct IngredientEmoji {

    // Ordered longest-keyword-first so specific terms (e.g. "spring onion")
    // match before shorter overlapping ones (e.g. "onion").
    private static let keywords: [(String, String)] = [
        ("spring onion",  "🌿"),
        ("bok choy",      "🥬"),
        ("bell pepper",   "🫑"),
        ("sweet potato",  "🍠"),
        ("oyster sauce",  "🫙"),
        ("cooking oil",   "🫚"),
        ("fish sauce",    "🫙"),
        ("soy sauce",     "🫙"),
        ("chili sauce",   "🫙"),
        ("strawberry",    "🍓"),
        ("blueberry",     "🫐"),
        ("pineapple",     "🍍"),
        ("watermelon",    "🍉"),
        ("eggplant",      "🍆"),
        ("aubergine",     "🍆"),
        ("cucumber",      "🥒"),
        ("capsicum",      "🫑"),
        ("broccoli",      "🥦"),
        ("mushroom",      "🍄"),
        ("cabbage",       "🥬"),
        ("avocado",       "🥑"),
        ("chicken",       "🍗"),
        ("sausage",       "🌭"),
        ("vinegar",       "🫙"),
        ("yogurt",        "🥛"),
        ("cheese",        "🧀"),
        ("butter",        "🧈"),
        ("shrimp",        "🦐"),
        ("salmon",        "🐟"),
        ("oyster",        "🦪"),
        ("noodle",        "🍜"),
        ("prawn",         "🦐"),
        ("lychee",        "🍈"),
        ("coffee",        "☕"),
        ("cherry",        "🍒"),
        ("potato",        "🥔"),
        ("tomato",        "🍅"),
        ("carrot",        "🥕"),
        ("onion",         "🧅"),
        ("garlic",        "🧄"),
        ("banana",        "🍌"),
        ("orange",        "🍊"),
        ("mango",         "🥭"),
        ("peach",         "🍑"),
        ("grape",         "🍇"),
        ("lemon",         "🍋"),
        ("bread",         "🍞"),
        ("flour",         "🌾"),
        ("sugar",         "🍬"),
        ("honey",         "🍯"),
        ("juice",         "🧃"),
        ("beans",         "🫘"),
        ("apple",         "🍎"),
        ("pasta",         "🍝"),
        ("pear",          "🍐"),
        ("kiwi",          "🥝"),
        ("corn",          "🌽"),
        ("tofu",          "🫘"),
        ("peas",          "🫛"),
        ("beef",          "🥩"),
        ("pork",          "🥩"),
        ("lamb",          "🥩"),
        ("duck",          "🍗"),
        ("steak",         "🥩"),
        ("tuna",          "🐟"),
        ("fish",          "🐟"),
        ("squid",         "🦑"),
        ("crab",          "🦀"),
        ("bacon",         "🥓"),
        ("milk",          "🥛"),
        ("cream",         "🥛"),
        ("rice",          "🍚"),
        ("oat",           "🌾"),
        ("egg",           "🥚"),
        ("ham",           "🥓"),
        ("oil",           "🫚"),
        ("salt",          "🧂"),
        ("sauce",         "🫙"),
        ("paste",         "🫙"),
        ("stock",         "🫙"),
        ("broth",         "🫙"),
        ("canned",        "🥫"),
        ("water",         "💧"),
        ("lime",          "🍋"),
        ("melon",         "🍈"),
        ("tea",           "🍵"),
    ]

    // Pre-sorted longest-first so the array above can be written in readable order.
    private static let sortedKeywords: [(String, String)] =
        keywords.sorted { $0.0.count > $1.0.count }

    static func emoji(for name: String) -> String {
        let lower = name.lowercased()
        return sortedKeywords.first(where: { lower.contains($0.0) })?.1 ?? "🛒"
    }
}
```

- [ ] **Step 5: Regenerate .xcodeproj so Xcode picks up the new source file**

```bash
cd SmartFridge && xcodegen generate
```

Expected: `Generating project SmartFridge` with no errors.

- [ ] **Step 6: Run the tests and verify they all pass**

```bash
cd SmartFridge && xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/IngredientEmojiTests 2>&1 | tail -20
```

Expected: `** TEST SUCCEEDED **` with 10 tests passing.

- [ ] **Step 7: Commit**

```bash
git add SmartFridge/SmartFridge/Utils/IngredientEmoji.swift \
        SmartFridge/SmartFridgeTests/IngredientEmojiTests.swift \
        SmartFridge/SmartFridge.xcodeproj/project.pbxproj
git commit -m "feat(ios): add IngredientEmoji utility with keyword-to-emoji mapping"
```

---

## Task 2: Add emoji icon to `ShoppingItemRow`

**Files:**
- Modify: `SmartFridge/SmartFridge/Views/Shopping/ShoppingListView.swift:131-169`

- [ ] **Step 1: Update `ShoppingItemRow` to show the emoji icon**

In `ShoppingItemRow.body`, the current `HStack` is:

```swift
HStack(spacing: 12) {
    Image(systemName: item.isPurchased ? "checkmark.circle.fill" : "circle")
        .foregroundStyle(item.isPurchased ? theme.colors.success : theme.colors.border)
        .font(.title3)
    VStack(alignment: .leading, spacing: 2) {
```

Replace it with:

```swift
HStack(spacing: 12) {
    Image(systemName: item.isPurchased ? "checkmark.circle.fill" : "circle")
        .foregroundStyle(item.isPurchased ? theme.colors.success : theme.colors.border)
        .font(.title3)
    Text(IngredientEmoji.emoji(for: item.name))
        .font(.system(size: 20))
        .frame(width: 36, height: 36)
        .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 8))
        .opacity(item.isPurchased ? 0.4 : 1.0)
    VStack(alignment: .leading, spacing: 2) {
```

- [ ] **Step 2: Build the app to verify no compilation errors**

```bash
cd SmartFridge && xcodebuild build -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -10
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Run the full test suite**

```bash
cd SmartFridge && xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -20
```

Expected: `** TEST SUCCEEDED **` — all existing tests plus the new `IngredientEmojiTests` pass.

- [ ] **Step 4: Commit**

```bash
git add SmartFridge/SmartFridge/Views/Shopping/ShoppingListView.swift
git commit -m "feat(ios): show ingredient emoji icon in shopping list rows"
```
