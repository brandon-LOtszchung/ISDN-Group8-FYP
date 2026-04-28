// App/SmartFridgeApp.swift
import SwiftUI

@main
struct SmartFridgeApp: App {
    @State private var appVM        = AppViewModel()
    @State private var shoppingVM   = ShoppingViewModel()
    @State private var themeManager = ThemeManager()
    @State private var languageManager = LanguageManager()
    @State private var planningVM   = PlanningViewModel()

    init() {
        configureUIAppearance()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appVM)
                .environment(shoppingVM)
                .environment(themeManager)
                .environment(languageManager)
                .environment(planningVM)
                .tint(themeManager.colors.primary)
                .task { await appVM.listenForAuthChanges() }
                .onChange(of: themeManager.theme) { _, newTheme in
                    applyNavBarAppearance(for: newTheme)
                }
                .alert("Language Changed", isPresented: Binding(
                    get: { languageManager.pendingRestart },
                    set: { _ in }
                )) {
                    Button("Exit Now") { exit(0) }
                    Button("Later", role: .cancel) { languageManager.pendingRestart = false }
                } message: {
                    Text("Restart SmartFridge to apply the new language.")
                }
        }
    }

    private func configureUIAppearance() {
        applyNavBarAppearance(for: themeManager.theme)
    }

    private func applyNavBarAppearance(for theme: ThemeType) {
        let boldFont17  = UIFont(name: "SpaceGrotesk-Bold", size: 17)
        let boldFont34  = UIFont(name: "SpaceGrotesk-Bold", size: 34)
        let nearBlack   = UIColor(Color(hex: "#1A1A1A"))
        let bgColor     = theme == .warm ? "#FEFAE0" : "#F0FEFF"
        let bg          = UIColor(Color(hex: bgColor))

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = bg
        navAppearance.shadowColor = UIColor(white: 0, alpha: 0.12)
        if let f17 = boldFont17 {
            navAppearance.titleTextAttributes = [
                .font: f17,
                .foregroundColor: nearBlack
            ]
        }
        if let f34 = boldFont34 {
            navAppearance.largeTitleTextAttributes = [
                .font: f34,
                .foregroundColor: nearBlack
            ]
        }
        UINavigationBar.appearance().standardAppearance   = navAppearance
        UINavigationBar.appearance().compactAppearance    = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().tintColor            = UIColor(Color(hex: "#1A1A1A"))

        // Tab bar — white background + thick black top border
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = .white
        tabAppearance.shadowColor = UIColor(white: 0, alpha: 0.20)

        if let f12 = UIFont(name: "SpaceGrotesk-SemiBold", size: 10) {
            let selectedAttrs: [NSAttributedString.Key: Any] = [
                .font: f12,
                .foregroundColor: nearBlack
            ]
            let normalAttrs: [NSAttributedString.Key: Any] = [
                .font: f12,
                .foregroundColor: UIColor(white: 0.55, alpha: 1)
            ]
            tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = selectedAttrs
            tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes   = normalAttrs
        }

        UITabBar.appearance().standardAppearance   = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        UITabBar.appearance().tintColor = nearBlack
        UITabBar.appearance().unselectedItemTintColor = UIColor(white: 0.55, alpha: 1)
    }
}
