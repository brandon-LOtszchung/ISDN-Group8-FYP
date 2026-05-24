// Views/Shared/TopBarView.swift
import SwiftUI

struct TopBarView: View {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var languageManager

    var body: some View {
        HStack {
            Text("SmartFridge")
                .font(.spaceGrotesk(.bold, size: 20))
                .foregroundStyle(Color(hex: "#1A1A1A"))
            Spacer()
            // Theme toggle
            Button {
                theme.setTheme(theme.theme == .warm ? .cool : .warm)
            } label: {
                Image(systemName: theme.theme == .warm ? "sun.max.fill" : "snowflake")
                    .foregroundStyle(Color(hex: "#1A1A1A"))
            }
            // Language picker
            Menu {
                ForEach(AppLanguage.allCases) { lang in
                    Button(lang.displayName) {
                        languageManager.setLanguage(lang)
                    }
                }
            } label: {
                Image(systemName: "globe")
                    .foregroundStyle(Color(hex: "#1A1A1A"))
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

struct TopBarToolbarModifier: ViewModifier {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var languageManager

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        theme.setTheme(theme.theme == .warm ? .cool : .warm)
                    } label: {
                        Image(systemName: theme.theme == .warm ? "sun.max.fill" : "snowflake")
                    }
                    .accessibilityLabel("Toggle theme")
                }
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        ForEach(AppLanguage.allCases) { lang in
                            Button(lang.displayName) { languageManager.setLanguage(lang) }
                        }
                    } label: {
                        Image(systemName: "globe")
                    }
                    .accessibilityLabel("Select language")
                }
            }
    }
}

extension View {
    func topBarToolbar() -> some View {
        modifier(TopBarToolbarModifier())
    }
}
