# Spec: Shopping List Ingredient Emoji Icons

**Date:** 2026-04-14  
**Branch:** ios-swift-app  
**Status:** Approved

## Overview

Add a food emoji icon beside each item row in the iOS shopping list screen. The icon gives users a quick visual cue for what ingredient they're looking at, making the list easier to scan.

## Approach

Emoji icons mapped from ingredient names — no network, no model changes, works offline.

- A new `IngredientEmoji` utility holds a keyword → emoji dictionary.
- Each `ShoppingItemRow` renders the emoji in a small rounded-rectangle container between the checkmark and the item name.
- Unknown ingredients fall back to 🛒.

## Files Changed

### New: `SmartFridge/SmartFridge/Utils/IngredientEmoji.swift`

```
struct IngredientEmoji {
    static func emoji(for name: String) -> String
}
```

- Lowercases the ingredient name and checks it against a keyword list using substring matching.
- Keywords are stored as an ordered array of `(keyword, emoji)` tuples, sorted longest-keyword-first so more specific terms (e.g. `"spring onion"`) match before shorter ones (e.g. `"onion"`).
- First match wins; fallback is 🛒.
- Keywords cover common HK grocery items across categories:
  - Vegetables: carrot 🥕, onion 🧅, garlic 🧄, broccoli 🥦, cabbage/bok choy 🥬, corn 🌽, tomato 🍅, avocado 🥑, potato 🥔, sweet potato 🍠, bell pepper/capsicum 🫑, chili 🌶️, cucumber 🥒, eggplant/aubergine 🍆, peas 🫛, mushroom 🍄, ginger 🫚, spring onion 🌿
  - Fruits: apple 🍎, orange 🍊, lemon 🍋, lime 🍋, banana 🍌, grape 🍇, strawberry 🍓, cherry 🍒, kiwi 🥝, peach 🍑, mango 🥭, pineapple 🍍, pear 🍐, blueberry 🫐, watermelon 🍉, melon 🍈, lychee 🍈
  - Proteins: beef/steak 🥩, pork 🥩, lamb 🥩, chicken 🍗, duck 🍗, egg 🥚, fish 🐟, salmon 🐟, tuna 🐟, shrimp/prawn 🦐, squid 🦑, crab 🦀, oyster 🦪, bacon 🥓, ham 🥓, tofu 🫘, sausage 🌭
  - Dairy: milk 🥛, cheese 🧀, butter 🧈, cream 🥛, yogurt 🥛
  - Grains/Carbs: rice 🍚, noodle 🍜, pasta 🍝, bread 🍞, flour 🌾, oat 🌾
  - Condiments/pantry: oil 🫚, salt 🧂, sugar 🍬, honey 🍯, sauce 🫙, paste 🫙, vinegar 🫙, soy sauce 🫙, oyster sauce 🫙, canned 🥫, stock/broth 🫙
  - Beverages: juice 🧃, water 💧, coffee ☕, tea 🍵, milk tea 🧋

### Modified: `SmartFridge/SmartFridge/Views/Shopping/ShoppingListView.swift`

In `ShoppingItemRow.body`, add between the checkmark `Image` and the item info `VStack`:

```swift
Text(IngredientEmoji.emoji(for: item.name))
    .font(.system(size: 20))
    .frame(width: 36, height: 36)
    .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 8))
    .opacity(item.isPurchased ? 0.4 : 1.0)
```

## Out of Scope

- No changes to `ShoppingListItem` model or Supabase schema.
- No network image fetching.
- No custom photo upload for ingredients.
- No emoji customisation by the user.
