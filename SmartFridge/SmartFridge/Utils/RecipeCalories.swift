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
