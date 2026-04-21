# Budget Slider — Onboarding Design Spec

**Date:** 2026-04-14
**Branch:** ios-swift-app
**Scope:** iOS app only — no web, backend, or data model changes

---

## Overview

Replace the three fixed pill buttons on the onboarding budget step with a custom single-handle price range slider. The slider lets users pick a maximum budget **per person** expressed in HK$. The selected value is mapped to the existing `"low"/"medium"/"high"` string tiers before being stored, so no backend or data model changes are required.

---

## Slider Behaviour

| Property | Value |
|---|---|
| Min | HK$10 |
| Max | HK$150 |
| Step | HK$5 |
| Default | HK$50 (Moderate) |
| Endpoint labels | `<HK$10` (left) · `>HK$150` (right) |

### Tier Mapping

| Slider value | Stored value | Display name | Track colour |
|---|---|---|---|
| HK$10–49 | `"low"` | Budget-Friendly | `#4CAF50` (green) |
| HK$50–99 | `"medium"` | Moderate | `#FF9800` (orange) |
| HK$100–150 | `"high"` | Premium | `#F44336` (red) |

---

## Visual Design

### Track

A three-zone coloured gradient drawn behind the native SwiftUI `Slider`. Zone widths are proportional to their HK$ ranges (40 px : 50 px : 50 px → 28.6% : 35.7% : 35.7%). The portion of the track to the right of the thumb is dimmed with a semi-transparent white overlay (`rgba(255,255,255,0.6)`) to communicate the "not yet reached" region.

### Thumb

Uses the native `Slider` thumb, recoloured dynamically to match the current zone colour. Colour transitions happen at the tier boundaries (HK$50 and HK$100).

### Price display (above the track)

```
HK$50          ← large bold number, zone colour
Moderate       ← tier name, same zone colour, smaller weight
per person     ← fixed secondary label, system secondary colour
```

Both the amount and the tier name update live as the user drags.

### Continue button

Always enabled on this step — the slider always has a value.

---

## Components

### `BudgetSliderView`

A self-contained SwiftUI view extracted from `OnboardingView`. Owns no state itself; receives a binding.

```swift
struct BudgetSliderView: View {
    @Binding var budgetAmount: Int   // HK$ integer, 10–150
}
```

Internally uses:
- `GeometryReader` to size the custom track
- A `ZStack` stacking the gradient track, the dim overlay, and the native `Slider` (with its built-in track hidden via `.tint(.clear)`)
- A `budgetTier(for:)` helper (free function or `static func` on `BudgetSliderView`) that returns `(value: String, label: String, color: Color)`

### `OnboardingView` changes

- Replace `@State private var selectedBudget = ""` with `@State private var budgetAmount: Int = 50`
- Replace the `budgetStep` computed property body (currently `FlowLayout` of pills) with `BudgetSliderView(budgetAmount: $budgetAmount)`
- Update `shouldShowContinue` for `.budget`: always `true`
- Update `finish()`: derive the tier string via `budgetTier(for: budgetAmount).value` instead of reading `selectedBudget`
- Update the summary step's budget display to show the tier label resolved from `budgetAmount`

### `Constants.budgetRanges` descriptions

Update the three description strings from "per meal" to "per person":

| Value | Label | Description (updated) |
|---|---|---|
| `"low"` | Budget-Friendly | Under HK$50 per person |
| `"medium"` | Moderate | HK$50–100 per person |
| `"high"` | Premium | Above HK$100 per person |

---

## Localisation

No new localisation keys are required. The tier display names (`Budget-Friendly`, `Moderate`, `Premium`) are already present in `Constants.budgetRanges` and can be read from there. The `per person` label should use the existing `onboarding.budget.title` key or a new key if the string needs translation — confirm against current `Localizable.strings` during implementation.

---

## Out of Scope

- Web app changes
- Backend / Supabase schema changes
- Changes to `FamilyPreferences.budgetRange` type (remains `String`)
- iPad layout adjustments
- Haptic feedback on tier boundary crossing (nice-to-have, not required)
