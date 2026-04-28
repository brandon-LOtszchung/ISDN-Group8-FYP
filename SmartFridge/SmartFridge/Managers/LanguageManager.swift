// Managers/LanguageManager.swift
import Foundation

@Observable
final class LanguageManager {
    // Stored value uses "zh-HK" for Supabase compatibility; Apple bundle folder is zh-Hant.lproj
    private(set) var language: AppLanguage
    var pendingRestart = false

    init() {
        let saved = UserDefaults.standard.string(forKey: "app-language")
        let lang = AppLanguage(rawValue: saved ?? "") ?? .en
        self.language = lang
        // Ensure the OS bundle is aligned with the saved preference on every launch
        LanguageManager.applyToSystem(lang)
    }

    func setLanguage(_ newLanguage: AppLanguage) {
        guard newLanguage != language else { return }
        language = newLanguage
        UserDefaults.standard.set(newLanguage.rawValue, forKey: "app-language")
        LanguageManager.applyToSystem(newLanguage)
        pendingRestart = true
    }

    // Converts stored AppLanguage raw value to the correct Apple locale identifier
    // for use with Bundle localisation lookups.
    func appleLocaleIdentifier(for lang: AppLanguage) -> String {
        lang == .zhHK ? "zh-Hant" : lang.rawValue
    }

    // Writes the iOS per-app language override so the correct .lproj bundle is
    // loaded on the next launch.  String(localized:) reads from the process bundle
    // which is fixed at launch — so a restart is required to take effect.
    private static func applyToSystem(_ lang: AppLanguage) {
        let identifier = lang == .zhHK ? "zh-Hant" : lang.rawValue
        UserDefaults.standard.set([identifier], forKey: "AppleLanguages")
    }
}
