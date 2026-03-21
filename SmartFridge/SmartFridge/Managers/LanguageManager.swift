// Managers/LanguageManager.swift
import Foundation

@Observable
final class LanguageManager {
    // Stored value uses "zh-HK" for Supabase compatibility; Apple bundle folder is zh-Hant.lproj
    private(set) var language: AppLanguage

    init() {
        let saved = UserDefaults.standard.string(forKey: "app-language")
        self.language = AppLanguage(rawValue: saved ?? "") ?? .en
    }

    func setLanguage(_ newLanguage: AppLanguage) {
        language = newLanguage
        UserDefaults.standard.set(newLanguage.rawValue, forKey: "app-language")
    }

    // Converts stored AppLanguage raw value to the correct Apple locale identifier
    // for use with Bundle localisation lookups.
    func appleLocaleIdentifier(for lang: AppLanguage) -> String {
        lang == .zhHK ? "zh-Hant" : lang.rawValue
    }
}
