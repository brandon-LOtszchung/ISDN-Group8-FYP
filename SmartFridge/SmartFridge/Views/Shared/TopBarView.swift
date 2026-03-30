// Views/Shared/TopBarView.swift
import SwiftUI

struct TopBarView: View {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var languageManager
    @State private var showProfileDrawer = false

    var body: some View {
        HStack {
            Text("SmartFridge")
                .font(.title2.bold())
                .foregroundStyle(theme.colors.primary)
            Spacer()
            // Theme toggle
            Button {
                theme.setTheme(theme.theme == .warm ? .cool : .warm)
            } label: {
                Image(systemName: theme.theme == .warm ? "sun.max.fill" : "snowflake")
                    .foregroundStyle(theme.colors.primary)
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
                    .foregroundStyle(theme.colors.primary)
            }
            // Profile button
            Button { showProfileDrawer = true } label: {
                Image(systemName: "person.circle")
                    .foregroundStyle(theme.colors.primary)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .sheet(isPresented: $showProfileDrawer) {
            ProfileDrawerView()
                .presentationDetents([.medium])
        }
    }
}

struct TopBarToolbarModifier: ViewModifier {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var languageManager
    @State private var showProfileDrawer = false

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
                ToolbarItem(placement: .topBarLeading) {
                    Button { showProfileDrawer = true } label: {
                        Image(systemName: "person.circle")
                    }
                    .accessibilityLabel("Profile")
                }
            }
            .sheet(isPresented: $showProfileDrawer) {
                ProfileDrawerView()
                    .presentationDetents([.medium])
            }
    }
}

extension View {
    func topBarToolbar() -> some View {
        modifier(TopBarToolbarModifier())
    }
}

// Profile drawer — shows family name and tappable member list
struct ProfileDrawerView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        NavigationStack {
            List {
                if let family = appVM.family {
                    Section(String(localized: "profile.family")) {
                        Text(family.name).font(.headline)
                    }
                }
                Section(String(localized: "profile.members")) {
                    ForEach(appVM.members) { member in
                        NavigationLink(value: member.id) {
                            ProfileMemberRow(member: member)
                        }
                    }
                }
            }
            .navigationTitle(String(localized: "profile.title"))
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: UUID.self) { memberId in
                MemberProfileView(memberId: memberId)
            }
        }
    }
}

private struct ProfileMemberRow: View {
    let member: FamilyMember

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(member.name)
                .font(.body)
            if let age = member.age {
                Text("\(String(localized: "profile.member.age")): \(age)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}
