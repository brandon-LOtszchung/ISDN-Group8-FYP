// App/ContentView.swift
import SwiftUI

struct ContentView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ShoppingViewModel.self) private var shoppingVM

    var body: some View {
        Group {
            if appVM.hasCompletedOnboarding {
                MainTabView()
                    .task { await shoppingVM.load() }
            } else {
                OnboardingView()
            }
        }
        .animation(.easeInOut, value: appVM.hasCompletedOnboarding)
    }
}

struct MainTabView: View {
    @Environment(ThemeManager.self) private var themeManager

    var body: some View {
        TabView {
            InventoryView()
                .tabItem { Label(String(localized: "tab.fridge"), systemImage: "refrigerator") }
            NavigationStack {
                FoodIdeaView()
            }
            .tabItem { Label(String(localized: "tab.plan"), systemImage: "lightbulb") }
            ShoppingListView()
                .tabItem { Label(String(localized: "tab.shopping"), systemImage: "cart") }
        }
    }
}
