// Constants/Constants.swift
import Foundation

struct CuisineOption: Identifiable {
    let id: String  // == value
    let value: String  // sent to API (lowercase)
    let label: String  // displayed in UI
}

enum Constants {
    static let defaultFamilyID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!

    static let cuisineOptions: [CuisineOption] = [
        CuisineOption(id: "chinese",    value: "chinese",    label: "Chinese"),
        CuisineOption(id: "cantonese",  value: "cantonese",  label: "Cantonese"),
        CuisineOption(id: "sichuan",    value: "sichuan",    label: "Sichuan"),
        CuisineOption(id: "western",    value: "western",    label: "Western"),
        CuisineOption(id: "italian",    value: "italian",    label: "Italian"),
        CuisineOption(id: "japanese",   value: "japanese",   label: "Japanese"),
        CuisineOption(id: "korean",     value: "korean",     label: "Korean"),
        CuisineOption(id: "thai",       value: "thai",       label: "Thai"),
        CuisineOption(id: "vietnamese", value: "vietnamese", label: "Vietnamese"),
        CuisineOption(id: "indian",     value: "indian",     label: "Indian"),
        CuisineOption(id: "mexican",    value: "mexican",    label: "Mexican"),
        CuisineOption(id: "fusion",     value: "fusion",     label: "Fusion"),
    ]

    static let dietaryRestrictions: [String] = [
        "Vegetarian", "Vegan", "Pescatarian", "Halal", "Kosher",
        "Low Sodium", "Low Sugar", "Low Fat", "Keto", "Gluten Free", "Fasting"
    ]

    static let allergies: [String] = [
        "Tree Nuts", "Peanuts", "Dairy", "Eggs",
        "Shellfish", "Fish", "Soy", "Wheat", "Sesame"
    ]

    static let healthConditions: [String] = [
        "Diabetes", "High Blood Pressure", "Heart Disease",
        "Kidney Disease", "High Cholesterol", "Gout"
    ]

    static let spiceLevels: [String] = ["none", "mild", "medium", "hot"]

    static let cookingSkillLevels: [String] = ["beginner", "intermediate", "advanced"]

    static let budgetRanges: [(value: String, label: String, description: String)] = [
        (value: "low",    label: "Budget-Friendly", description: "Under HK$100 per meal"),
        (value: "medium", label: "Moderate",        description: "HK$100–200 per meal"),
        (value: "high",   label: "Premium",         description: "Above HK$200 per meal"),
    ]

    static let inventoryCategories: [String] = [
        "Protein", "Vegetable", "Fruit", "Dairy",
        "Grain", "Condiment", "Beverage", "Other"
    ]

    // UserDefaults keys (match web app STORAGE_KEYS)
    enum StorageKeys {
        static let hasCompletedOnboarding = "smart-fridge-onboarding"
        static let fridgeInitialized      = "smart-fridge-initialized"
        static let familyData             = "smart-fridge-family"
        static let inventory              = "smart-fridge-inventory"
    }
}
