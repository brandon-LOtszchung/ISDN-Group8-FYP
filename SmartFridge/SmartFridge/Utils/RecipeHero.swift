// Utils/RecipeHero.swift
import SwiftUI

/// Maps cuisine styles to gradient color pairs and recipe names to emojis,
/// providing visually distinct hero backgrounds for recipe cards and detail views.
enum RecipeHero {

    // MARK: - Gradient

    /// Returns (startHex, endHex) for a top-leading → bottom-trailing LinearGradient.
    /// Exposed as hex strings for testability; use `gradient(for:)` in views.
    static func hexPair(for cuisineStyle: String) -> (String, String) {
        switch cuisineStyle.lowercased() {
        case "cantonese":   return ("#FFE0C0", "#FFBA7A")
        case "chinese":     return ("#FFF6C2", "#FFD94A")
        case "sichuan":     return ("#FFCDC5", "#FF7A6A")
        case "japanese":    return ("#FFE4E8", "#FFB3C2")
        case "korean":      return ("#FFD8B8", "#FF8C5A")
        case "filipino":    return ("#E8D8C0", "#C49A6C")
        case "indonesian":  return ("#FFF0C0", "#FFCC55")
        case "thai":        return ("#C8F7DC", "#56D98A")
        case "vietnamese":  return ("#B8F0E8", "#4DCFBA")
        case "indian":      return ("#FFD0A8", "#FF8C42")
        case "western":     return ("#D8EEFF", "#82BFFF")
        case "italian":     return ("#FFD8C0", "#FF9060")
        case "mexican":     return ("#DDFFC0", "#88D840")
        case "fusion":      return ("#E8D8FF", "#B882FF")
        default:            return ("#FFF0E8", "#FFBA7A")
        }
    }

    /// Returns a LinearGradient for use as a recipe card or detail hero background.
    static func gradient(for cuisineStyle: String) -> LinearGradient {
        let (s, e) = hexPair(for: cuisineStyle)
        return LinearGradient(
            colors: [Color(hex: s), Color(hex: e)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Emoji

    // Ordered longest-keyword-first so specific terms match before shorter overlapping ones.
    private static let keywords: [(String, String)] = [
        ("nasi goreng",  "🍜"),
        ("fried rice",   "🍳"),
        ("mapo tofu",    "🫕"),
        ("bok choy",     "🥬"),
        ("bibimbap",     "🥘"),
        ("adobo",        "🍖"),
        ("teriyaki",     "🐟"),
        ("hotpot",       "🫕"),
        ("dumpling",     "🥟"),
        ("sushi",        "🍱"),
        ("ramen",        "🍜"),
        ("curry",        "🍛"),
        ("pasta",        "🍝"),
        ("pizza",        "🍕"),
        ("burger",       "🍔"),
        ("steak",        "🥩"),
        ("salad",        "🥗"),
        ("stew",         "🍲"),
        ("soup",         "🍲"),
        ("noodle",       "🍜"),
        ("tofu",         "🫘"),
        ("salmon",       "🐟"),
        ("shrimp",       "🦐"),
        ("prawn",        "🦐"),
        ("crab",         "🦀"),
        ("fish",         "🐟"),
        ("chicken",      "🍗"),
        ("duck",         "🍗"),
        ("pork",         "🍖"),
        ("beef",         "🥩"),
        ("lamb",         "🥩"),
        ("egg",          "🥚"),
        ("rice",         "🍚"),
        ("bread",        "🍞"),
        ("vegetable",    "🥦"),
    ]

    private static let sortedKeywords: [(String, String)] =
        keywords.sorted { $0.0.count > $1.0.count }

    /// Returns an emoji representing the recipe based on keywords in the name.
    /// Falls back to "🍽️" for unrecognised names.
    static func emoji(for name: String) -> String {
        let lower = name.lowercased()
        return sortedKeywords.first(where: { lower.contains($0.0) })?.1 ?? "🍽️"
    }
}
