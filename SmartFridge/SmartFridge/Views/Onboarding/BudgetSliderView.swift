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
                        let thumbHalf = CGFloat(17)  // half of rendered 34pt thumb image
                        let usableWidth = geo.size.width - thumbHalf * 2
                        HStack(spacing: 0) {
                            Color.clear.frame(width: thumbHalf + usableWidth * pct)
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
