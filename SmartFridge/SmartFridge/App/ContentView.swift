// App/ContentView.swift
import SwiftUI

struct ContentView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ShoppingViewModel.self) private var shoppingVM

    var body: some View {
        Group {
            if !appVM.isAuthResolved {
                Color(hex: "#FEFAE0").ignoresSafeArea()
            } else if appVM.currentUserId == nil {
                LoginView()
            } else if appVM.family == nil {
                OnboardingView()
            } else {
                MainTabView()
                    .task {
                        if let fid = appVM.familyId {
                            shoppingVM.familyId = fid
                        }
                        await shoppingVM.load()
                    }
            }
        }
        .preferredColorScheme(.light)
        .animation(.easeInOut, value: appVM.isAuthResolved)
        .animation(.easeInOut, value: appVM.currentUserId == nil)
        .animation(.easeInOut, value: appVM.family == nil)
    }
}

struct MainTabView: View {
    @Environment(ThemeManager.self) private var themeManager

    var body: some View {
        TabView {
            NavigationStack { InventoryView() }
                .tabItem { Label(String(localized: "tab.fridge"), systemImage: "refrigerator") }
            NavigationStack { FoodIdeaView() }
                .tabItem { Label(String(localized: "tab.plan"), systemImage: "lightbulb") }
            NavigationStack { ShoppingListView() }
                .tabItem { Label(String(localized: "tab.shopping"), systemImage: "cart") }
            ProfileDrawerView()
                .tabItem { Label(String(localized: "tab.profile"), systemImage: "person.circle") }
        }
        .background(themeManager.colors.background)
    }
}
