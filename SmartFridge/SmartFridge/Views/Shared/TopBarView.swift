// Views/Shared/TopBarView.swift
import SwiftUI

private let privacyPolicyURL = URL(string: "https://brandon-lotsz.github.io/smartfridge-privacy/")!

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

// Profile drawer — shows family name and tappable member list
struct ProfileDrawerView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @State private var showAddMember = false
    @State private var memberToDelete: FamilyMember? = nil
    @State private var showSignOutConfirm = false

    var body: some View {
        NavigationStack {
            List {
                if let family = appVM.family {
                    Section(String(localized: "profile.family")) {
                        Text(family.name).font(.spaceGrotesk(.semibold, size: 17))
                    }
                }
                Section(String(localized: "profile.about")) {
                    Link(destination: privacyPolicyURL) {
                        Label(String(localized: "profile.privacy_policy"), systemImage: "hand.raised")
                    }
                    LabeledContent(String(localized: "profile.version"),
                                   value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                }
                Section(String(localized: "profile.members")) {
                    ForEach(appVM.members) { member in
                        NavigationLink(value: member.id) {
                            ProfileMemberRow(member: member)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                memberToDelete = member
                            } label: {
                                Label(String(localized: "common.delete"), systemImage: "trash")
                            }
                        }
                    }
                }
            }
            .navigationTitle(String(localized: "profile.title"))
            .navigationBarTitleDisplayMode(.large)
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background {
                NeuBackground(screen: .profile)
                    .environment(theme)
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    showSignOutConfirm = true
                } label: {
                    Text(String(localized: "profile.sign_out"))
                        .font(.spaceGrotesk(.semibold, size: 16))
                        .foregroundStyle(theme.colors.danger)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(.secondarySystemBackground))
                }
            }
            .confirmationDialog(String(localized: "profile.sign_out_confirm"), isPresented: $showSignOutConfirm, titleVisibility: .visible) {
                Button(String(localized: "profile.sign_out"), role: .destructive) { appVM.signOut() }
                Button(String(localized: "common.cancel"), role: .cancel) {}
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddMember = true
                    } label: {
                        Label(String(localized: "profile.add_member"), systemImage: "person.badge.plus")
                            .labelStyle(.titleAndIcon)
                    }
                }
            }
            .navigationDestination(for: UUID.self) { memberId in
                MemberProfileView(memberId: memberId)
            }
            .sheet(isPresented: $showAddMember) {
                NavigationStack {
                    MemberProfileView(memberId: nil)
                }
                .environment(appVM)
                .environment(theme)
            }
            .alert(
                String(localized: "profile.member.delete_confirm_title"),
                isPresented: Binding(
                    get: { memberToDelete != nil },
                    set: { if !$0 { memberToDelete = nil } }
                ),
                presenting: memberToDelete
            ) { member in
                Button(String(localized: "common.delete"), role: .destructive) {
                    appVM.deleteMember(id: member.id)
                    memberToDelete = nil
                }
                Button(String(localized: "common.cancel"), role: .cancel) {
                    memberToDelete = nil
                }
            } message: { _ in
                Text(String(localized: "profile.member.delete_confirm_message"))
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
