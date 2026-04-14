# Budget Slider — Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three fixed pill buttons on the onboarding budget step with a custom single-handle price-range slider that maps HK$10–150 (per person) to the existing `"low"/"medium"/"high"` tier strings.

**Architecture:** A new `BudgetSliderView` (SwiftUI) wraps a `ZoneTrackSlider` (`UIViewRepresentable` around `UISlider`) overlaid on a three-zone gradient track drawn with `GeometryReader`. The tier mapping lives in a free function `budgetTier(for:)` that is internal (not private) so it can be unit-tested. `OnboardingView` swaps its `String` state for an `Int` and delegates rendering to `BudgetSliderView`.

**Tech Stack:** Swift 5.9, SwiftUI (iOS 17), UIKit (`UISlider` via `UIViewRepresentable`), XCTest

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `SmartFridge/SmartFridge/Views/Onboarding/BudgetSliderView.swift` | `BudgetTier` model, `budgetTier(for:)` function, `ZoneTrackSlider` (UIViewRepresentable), `BudgetSliderView` |
| Modify | `SmartFridge/SmartFridge/Constants/Constants.swift` | Update `budgetRanges` descriptions to reflect new per-person thresholds |
| Modify | `SmartFridge/SmartFridge/Resources/en.lproj/Localizable.strings` | Update budget title; add `onboarding.budget.per_person` key |
| Modify | `SmartFridge/SmartFridge/Resources/zh-Hant.lproj/Localizable.strings` | Same |
| Modify | `SmartFridge/SmartFridge/Resources/fil.lproj/Localizable.strings` | Same |
| Modify | `SmartFridge/SmartFridge/Resources/id.lproj/Localizable.strings` | Same |
| Modify | `SmartFridge/SmartFridge/Views/Onboarding/OnboardingView.swift` | Replace `selectedBudget: String` with `budgetAmount: Int`; update `budgetStep`, `shouldShowContinue`, `finish()`, `summaryStep` |
| Create | `SmartFridge/SmartFridgeTests/BudgetSliderTests.swift` | Unit tests for `budgetTier(for:)` |

---

## Task 1: Update localization strings

**Files:**
- Modify: `SmartFridge/SmartFridge/Resources/en.lproj/Localizable.strings:16`
- Modify: `SmartFridge/SmartFridge/Resources/zh-Hant.lproj/Localizable.strings:16`
- Modify: `SmartFridge/SmartFridge/Resources/fil.lproj/Localizable.strings:16`
- Modify: `SmartFridge/SmartFridge/Resources/id.lproj/Localizable.strings:16`

- [ ] **Step 1: Update the budget title and add per_person key in en.lproj**

Replace line 16 in `en.lproj/Localizable.strings` and add the new key on line 17:

```
"onboarding.budget.title"          = "What's your budget per person?";
"onboarding.budget.per_person"     = "per person";
```

- [ ] **Step 2: Update zh-Hant.lproj**

Replace line 16 and add line 17:

```
"onboarding.budget.title"          = "每人的飲食預算是多少？";
"onboarding.budget.per_person"     = "每人";
```

- [ ] **Step 3: Update fil.lproj**

Replace line 16 and add line 17:

```
"onboarding.budget.title"          = "Ano ang iyong badyet bawat tao?";
"onboarding.budget.per_person"     = "bawat tao";
```

- [ ] **Step 4: Update id.lproj**

Replace line 16 and add line 17:

```
"onboarding.budget.title"          = "Berapa anggaran makan per orang Anda?";
"onboarding.budget.per_person"     = "per orang";
```

- [ ] **Step 5: Commit**

```bash
git add SmartFridge/SmartFridge/Resources/
git commit -m "feat(ios): update budget localization strings to per-person"
```

---

## Task 2: Update Constants.budgetRanges

**Files:**
- Modify: `SmartFridge/SmartFridge/Constants/Constants.swift:47-51`

- [ ] **Step 1: Replace the budgetRanges definition**

In `Constants.swift`, replace lines 47–51 with:

```swift
static let budgetRanges: [(value: String, label: String, description: String)] = [
    (value: "low",    label: "Budget-Friendly", description: "Under HK$50 per person"),
    (value: "medium", label: "Moderate",        description: "HK$50–100 per person"),
    (value: "high",   label: "Premium",         description: "Above HK$100 per person"),
]
```

- [ ] **Step 2: Commit**

```bash
git add SmartFridge/SmartFridge/Constants/Constants.swift
git commit -m "feat(ios): update budgetRanges descriptions to per-person thresholds"
```

---

## Task 3: Write failing tests for budgetTier mapping

**Files:**
- Create: `SmartFridge/SmartFridgeTests/BudgetSliderTests.swift`

- [ ] **Step 1: Create the test file**

```swift
// SmartFridgeTests/BudgetSliderTests.swift
import XCTest
@testable import SmartFridge

final class BudgetSliderTests: XCTestCase {

    func test_budgetTier_10_isLow() {
        let tier = budgetTier(for: 10)
        XCTAssertEqual(tier.value, "low")
        XCTAssertEqual(tier.label, "Budget-Friendly")
    }

    func test_budgetTier_49_isStillLow() {
        XCTAssertEqual(budgetTier(for: 49).value, "low")
    }

    func test_budgetTier_50_isMedium() {
        let tier = budgetTier(for: 50)
        XCTAssertEqual(tier.value, "medium")
        XCTAssertEqual(tier.label, "Moderate")
    }

    func test_budgetTier_99_isStillMedium() {
        XCTAssertEqual(budgetTier(for: 99).value, "medium")
    }

    func test_budgetTier_100_isHigh() {
        let tier = budgetTier(for: 100)
        XCTAssertEqual(tier.value, "high")
        XCTAssertEqual(tier.label, "Premium")
    }

    func test_budgetTier_150_isStillHigh() {
        XCTAssertEqual(budgetTier(for: 150).value, "high")
    }

    func test_budgetTier_default50_isMedium() {
        // The slider default is HK$50 — must map to "medium"
        XCTAssertEqual(budgetTier(for: 50).value, "medium")
    }
}
```

- [ ] **Step 2: Regenerate the Xcode project so the new test file is included**

```bash
cd SmartFridge && xcodegen generate
```

- [ ] **Step 3: Run the tests and confirm they fail to compile**

```bash
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/BudgetSliderTests 2>&1 | tail -20
```

Expected: build error — `budgetTier` is not yet defined.

- [ ] **Step 4: Commit the test file**

```bash
git add SmartFridge/SmartFridgeTests/BudgetSliderTests.swift
git commit -m "test(ios): add failing tests for budgetTier mapping"
```

---

## Task 4: Create BudgetSliderView (make tests pass)

**Files:**
- Create: `SmartFridge/SmartFridge/Views/Onboarding/BudgetSliderView.swift`

- [ ] **Step 1: Create the file with BudgetTier, budgetTier(for:), ZoneTrackSlider, and BudgetSliderView**

```swift
// Views/Onboarding/BudgetSliderView.swift
import SwiftUI

// MARK: - Tier Model (internal for testability)

struct BudgetTier {
    let value: String     // stored in FamilyPreferences.budgetRange
    let label: String     // shown in UI
    let color: Color      // SwiftUI color for price display
    let uiColor: UIColor  // UIKit color for UISlider thumb
}

/// Maps an HK$ integer amount to a BudgetTier.
/// Boundaries: <50 → low, 50–99 → medium, 100+ → high.
func budgetTier(for amount: Int) -> BudgetTier {
    switch amount {
    case ..<50:    return .low
    case 50..<100: return .medium
    default:       return .high
    }
}

private extension BudgetTier {
    static let low = BudgetTier(
        value: "low", label: "Budget-Friendly",
        color: Color(red: 0.298, green: 0.686, blue: 0.314),
        uiColor: UIColor(red: 0.298, green: 0.686, blue: 0.314, alpha: 1)
    )
    static let medium = BudgetTier(
        value: "medium", label: "Moderate",
        color: Color(red: 1.0, green: 0.596, blue: 0.0),
        uiColor: UIColor(red: 1.0, green: 0.596, blue: 0.0, alpha: 1)
    )
    static let high = BudgetTier(
        value: "high", label: "Premium",
        color: Color(red: 0.957, green: 0.263, blue: 0.212),
        uiColor: UIColor(red: 0.957, green: 0.263, blue: 0.212, alpha: 1)
    )
}

// MARK: - UIViewRepresentable Slider (private)

private struct ZoneTrackSlider: UIViewRepresentable {
    @Binding var amount: Int   // must be in 10...150, multiples of 5
    let thumbColor: UIColor

    func makeCoordinator() -> Coordinator { Coordinator(amount: $amount) }

    func makeUIView(context: Context) -> UISlider {
        let slider = UISlider()
        slider.minimumValue = 10
        slider.maximumValue = 150
        slider.minimumTrackTintColor = .clear   // hide native track fill
        slider.maximumTrackTintColor = .clear
        slider.addTarget(context.coordinator,
                         action: #selector(Coordinator.changed(_:)),
                         for: .valueChanged)
        return slider
    }

    func updateUIView(_ uiView: UISlider, context: Context) {
        let target = Float(amount)
        if uiView.value != target { uiView.value = target }
        let img = thumbImage(color: thumbColor)
        uiView.setThumbImage(img, for: .normal)
        uiView.setThumbImage(img, for: .highlighted)
    }

    /// Renders a white-bordered circle filled with `color`, with a drop shadow.
    private func thumbImage(color: UIColor) -> UIImage {
        let diameter: CGFloat = 26
        let padding: CGFloat = 4   // space for the drop shadow
        let total = diameter + 2 * padding
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: total, height: total))
        return renderer.image { ctx in
            // Outer white circle (provides border + shadow)
            ctx.cgContext.setShadow(offset: CGSize(width: 0, height: 2), blur: 6,
                                    color: UIColor.black.withAlphaComponent(0.25).cgColor)
            UIColor.white.setFill()
            UIBezierPath(ovalIn: CGRect(x: padding, y: padding,
                                        width: diameter, height: diameter)).fill()
            // Inner colored circle (the visible thumb)
            ctx.cgContext.setShadow(offset: .zero, blur: 0, color: nil)
            color.setFill()
            let inset: CGFloat = 3
            UIBezierPath(ovalIn: CGRect(x: padding + inset, y: padding + inset,
                                        width: diameter - 2 * inset,
                                        height: diameter - 2 * inset)).fill()
        }
    }

    // MARK: Coordinator

    final class Coordinator: NSObject {
        var amount: Binding<Int>
        init(amount: Binding<Int>) { self.amount = amount }

        @objc func changed(_ sender: UISlider) {
            let step: Float = 5
            let snapped = Int((sender.value / step).rounded() * step)
            let clamped = max(10, min(150, snapped))
            if amount.wrappedValue != clamped { amount.wrappedValue = clamped }
            sender.value = Float(clamped)  // snap the visual thumb too
        }
    }
}

// MARK: - BudgetSliderView

struct BudgetSliderView: View {
    @Binding var budgetAmount: Int   // 10...150, multiples of 5

    // Slider constants
    private static let sliderMin  = 10
    private static let sliderMax  = 150
    private static let totalRange = Double(sliderMax - sliderMin)  // 140

    // Zone boundaries as gradient stop locations:
    //   green:  HK$10–49  → 0 ... 40/140 ≈ 0.2857
    //   orange: HK$50–99  → 40/140 ... 90/140 ≈ 0.6429
    //   red:    HK$100–150 → 90/140 ... 1.0
    private static let zoneStops: [Gradient.Stop] = [
        .init(color: Color(red: 0.298, green: 0.686, blue: 0.314), location: 0),
        .init(color: Color(red: 0.298, green: 0.686, blue: 0.314), location: 0.2857),
        .init(color: Color(red: 1.0,   green: 0.596, blue: 0.0),   location: 0.2857),
        .init(color: Color(red: 1.0,   green: 0.596, blue: 0.0),   location: 0.6429),
        .init(color: Color(red: 0.957, green: 0.263, blue: 0.212), location: 0.6429),
        .init(color: Color(red: 0.957, green: 0.263, blue: 0.212), location: 1.0),
    ]

    var body: some View {
        let tier = budgetTier(for: budgetAmount)
        VStack(spacing: 16) {
            // Price display
            VStack(spacing: 4) {
                Text("HK$\(budgetAmount)")
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundStyle(tier.color)
                Text(tier.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(tier.color)
                Text(String(localized: "onboarding.budget.per_person"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .multilineTextAlignment(.center)

            // Slider area: gradient track + UISlider overlay
            ZStack {
                GeometryReader { geo in
                    let pct = Double(budgetAmount - Self.sliderMin) / Self.totalRange
                    ZStack(alignment: .leading) {
                        // Three-zone gradient track (6 pt tall, vertically centred)
                        LinearGradient(stops: Self.zoneStops,
                                       startPoint: .leading, endPoint: .trailing)
                            .frame(height: 6)
                            .clipShape(RoundedRectangle(cornerRadius: 3))
                            .frame(maxHeight: .infinity)

                        // White dim overlay covers the right (not-yet-reached) portion
                        HStack(spacing: 0) {
                            Color.clear.frame(width: geo.size.width * pct)
                            Color.white.opacity(0.6)
                        }
                        .frame(height: 6)
                        .clipShape(RoundedRectangle(cornerRadius: 3))
                        .frame(maxHeight: .infinity)
                    }
                }

                // UISlider: native track hidden, custom coloured thumb
                ZoneTrackSlider(amount: $budgetAmount, thumbColor: tier.uiColor)
                    .accessibilityLabel(String(localized: "onboarding.budget.per_person"))
                    .accessibilityValue("HK$\(budgetAmount)")
            }
            .frame(height: 44)   // standard touch-target height

            // Min / max labels
            HStack {
                Text("<HK$\(Self.sliderMin)")
                Spacer()
                Text(">HK$\(Self.sliderMax)")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
    }
}
```

- [ ] **Step 2: Regenerate the Xcode project to include the new source file**

```bash
cd SmartFridge && xcodegen generate
```

- [ ] **Step 3: Run tests — expect them to pass**

```bash
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/BudgetSliderTests 2>&1 | tail -20
```

Expected output contains: `Test Suite 'BudgetSliderTests' passed`

- [ ] **Step 4: Commit**

```bash
git add SmartFridge/SmartFridge/Views/Onboarding/BudgetSliderView.swift \
        SmartFridge/SmartFridge/project.yml
git commit -m "feat(ios): add BudgetSliderView with three-zone gradient track"
```

---

## Task 5: Wire BudgetSliderView into OnboardingView

**Files:**
- Modify: `SmartFridge/SmartFridge/Views/Onboarding/OnboardingView.swift`

- [ ] **Step 1: Replace the `selectedBudget` state with `budgetAmount`**

In `OnboardingView`, find and replace:

```swift
// Remove:
@State private var selectedBudget = ""

// Add (after selectedSkill line):
@State private var budgetAmount: Int = 50
```

- [ ] **Step 2: Replace the `budgetStep` body**

Replace the entire `budgetStep` computed property:

```swift
private var budgetStep: some View {
    VStack(alignment: .leading, spacing: 16) {
        Text("💵").font(.system(size: emojiSize)).accessibilityHidden(true)
        Text(String(localized: "onboarding.budget.title")).font(.title.bold())
        BudgetSliderView(budgetAmount: $budgetAmount)
    }
}
```

- [ ] **Step 3: Update `shouldShowContinue` for `.budget`**

In the `shouldShowContinue` switch, replace:

```swift
// Remove:
case .budget: return !selectedBudget.isEmpty

// Replace with:
case .budget: return true
```

- [ ] **Step 4: Update `finish()` to derive the tier string**

In `finish()`, inside `FamilyPreferences(...)`, replace:

```swift
// Remove:
budgetRange: selectedBudget,

// Replace with:
budgetRange: budgetTier(for: budgetAmount).value,
```

- [ ] **Step 5: Update `summaryStep` to read from `budgetAmount`**

In `summaryStep`, replace the budget `LabeledContent` line:

```swift
// Remove:
LabeledContent(String(localized: "onboarding.summary.budget"),
               value: Constants.budgetRanges.first(where: { $0.value == selectedBudget })?.label ?? selectedBudget)

// Replace with:
LabeledContent(String(localized: "onboarding.summary.budget"),
               value: budgetTier(for: budgetAmount).label)
```

- [ ] **Step 6: Commit**

```bash
git add SmartFridge/SmartFridge/Views/Onboarding/OnboardingView.swift
git commit -m "feat(ios): replace budget pills with BudgetSliderView in OnboardingView"
```

---

## Task 6: Build verification

- [ ] **Step 1: Regenerate project and run full test suite**

```bash
cd SmartFridge && xcodegen generate && \
xcodebuild test -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -30
```

Expected: `** TEST SUCCEEDED **` — all suites pass, no regressions.

- [ ] **Step 2: Build for simulator to catch any runtime issues**

```bash
xcodebuild build -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' 2>&1 | tail -10
```

Expected: `** BUILD SUCCEEDED **`

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Single-handle slider, HK$10–150, step HK$5, default HK$50 | Task 4 — `ZoneTrackSlider` (min/max/step/default) |
| Three-zone gradient track (green/orange/red) | Task 4 — `zoneStops` in `BudgetSliderView` |
| Thumb adopts zone colour | Task 4 — `thumbColor: tier.uiColor` passed to `ZoneTrackSlider.updateUIView` |
| Price label colour adopts zone colour | Task 4 — `foregroundStyle(tier.color)` |
| "per person" label | Tasks 1 + 4 — localization key + `BudgetSliderView` |
| Tier mapping: <50 → low, 50–99 → medium, 100+ → high | Tasks 3 + 4 — tested in `BudgetSliderTests` |
| Continue always enabled on budget step | Task 5 — `case .budget: return true` |
| Summary step shows tier label | Task 5 — `budgetTier(for: budgetAmount).label` |
| `finish()` stores `"low"/"medium"/"high"` string | Task 5 — `budgetTier(for: budgetAmount).value` |
| Constants descriptions updated to per-person | Task 2 |
| Budget title updated to "per person" | Task 1 |

**No gaps found.**
