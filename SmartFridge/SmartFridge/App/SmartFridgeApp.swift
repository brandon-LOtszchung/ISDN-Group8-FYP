// App/SmartFridgeApp.swift
import SwiftUI

@main
struct SmartFridgeApp: App {
    @State private var appVM        = AppViewModel()
    @State private var shoppingVM   = ShoppingViewModel()
    @State private var themeManager = ThemeManager()
    @State private var languageManager = LanguageManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appVM)
                .environment(shoppingVM)
                .environment(themeManager)
                .environment(languageManager)
                .tint(themeManager.colors.primary)
                .task { await appVM.loadAll() }
        }
    }
}
