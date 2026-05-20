// Views/Profile/ProfileDrawerView.swift
import SwiftUI

private let privacyPolicyURL = URL(string: "https://brandon-lotsz.github.io/smartfridge-privacy/")!

struct ProfileDrawerView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme

    @State private var showAddMember = false
    @State private var memberToDelete: FamilyMember? = nil
    @State private var showSignOutConfirm = false
    @State private var showDeleteAccountConfirm = false

    var body: some View {
        NavigationStack {
            List {
                familySection
                membersSection
                aboutSection
                dangerSection
            }
            .listStyle(.insetGrouped)
            .listSectionSpacing(8)
            .scrollContentBackground(.hidden)
            .background {
                NeuBackground(screen: .profile)
                    .environment(theme)
            }
            .navigationTitle(String(localized: "profile.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showAddMember = true } label: {
                        Image(systemName: "person.badge.plus")
                            .foregroundStyle(theme.colors.primary)
                            .fontWeight(.semibold)
                    }
                    .accessibilityLabel(String(localized: "profile.add_member"))
                }
            }
            .topBarToolbar()
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
            .confirmationDialog(
                String(localized: "profile.sign_out_confirm"),
                isPresented: $showSignOutConfirm,
                titleVisibility: .visible
            ) {
                Button(String(localized: "profile.sign_out"), role: .destructive) {
#if DEBUG
                    print("[ProfileDrawer] sign out confirmed — userId=\(appVM.currentUserId?.uuidString ?? "nil")")
#endif
                    appVM.signOut()
                }
                Button(String(localized: "common.cancel"), role: .cancel) {}
            }
            .alert(
                String(localized: "profile.delete_account.confirm.title"),
                isPresented: $showDeleteAccountConfirm
            ) {
                Button(String(localized: "profile.delete_account.confirm.action"), role: .destructive) {
#if DEBUG
                    print("[ProfileDrawer] delete account confirmed — userId=\(appVM.currentUserId?.uuidString ?? "nil")")
#endif
                    appVM.signOut()
                }
                Button(String(localized: "common.cancel"), role: .cancel) {}
            } message: {
                Text(String(localized: "profile.delete_account.confirm.message"))
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
#if DEBUG
                    print("[ProfileDrawer] delete member confirmed — '\(member.name)' id=\(member.id)")
#endif
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
        .environment(appVM)
        .environment(theme)
    }

    // MARK: - Sections

    @ViewBuilder
    private var familySection: some View {
        if let family = appVM.family {
            Section {
                HStack(spacing: 14) {
                    ZStack {
                        Rectangle()
                            .fill(Color(hex: "#E8A04A"))
                            .frame(width: 44, height: 44)
                            .overlay(Rectangle().stroke(theme.colors.border, lineWidth: 2))
                            .shadow(color: theme.colors.shadow.opacity(0.5), radius: 0, x: 3, y: 3)
                        Image("ic-family")
                            .renderingMode(.template)
                            .resizable().scaledToFit().frame(width: 24, height: 24)
                            .foregroundStyle(Color(hex: "#1A1630"))
                    }
                    VStack(alignment: .leading, spacing: 3) {
                        Text(String(localized: "profile.family"))
                            .font(.dotGothic(11))
                            .foregroundStyle(theme.colors.textMuted)
                        Text(family.name)
                            .font(.pixelify(17, weight: .bold))
                            .foregroundStyle(theme.colors.text)
                    }
                    Spacer()
                }
                .padding(14)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 4, trailing: 16))
                .listRowSeparator(.hidden)
            }
        }
    }

    private var membersSection: some View {
        Section {
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
                .listRowBackground(theme.colors.surface)
                .listRowSeparator(.hidden)
            }
        } header: {
            Text(String(localized: "profile.members"))
                .font(.dotGothic(11))
                .foregroundStyle(theme.colors.textMuted)
        }
    }

    private var aboutSection: some View {
        Section {
            Link(destination: privacyPolicyURL) {
                HStack {
                    Image(systemName: "hand.raised")
                        .foregroundStyle(theme.colors.primary)
                        .frame(width: 22)
                    Text(String(localized: "profile.privacy_policy"))
                        .font(.dotGothic(14))
                        .foregroundStyle(theme.colors.text)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(theme.colors.textMuted)
                }
                .padding(.vertical, 2)
            }
            .listRowBackground(theme.colors.surface)
            .listRowSeparator(.hidden)

            HStack {
                Image(systemName: "info.circle")
                    .foregroundStyle(theme.colors.textMuted)
                    .frame(width: 22)
                Text(String(localized: "profile.version"))
                    .font(.dotGothic(14))
                    .foregroundStyle(theme.colors.text)
                Spacer()
                Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                    .font(.spaceGrotesk(.regular, size: 14))
                    .foregroundStyle(theme.colors.textMuted)
            }
            .padding(.vertical, 2)
            .listRowBackground(theme.colors.surface)
            .listRowSeparator(.hidden)
        } header: {
            Text(String(localized: "profile.about"))
                .font(.dotGothic(11))
                .foregroundStyle(theme.colors.textMuted)
        }
    }

    private var dangerSection: some View {
        Section {
            Button {
                showSignOutConfirm = true
            } label: {
                Text(String(localized: "profile.sign_out"))
                    .font(.pixelify(15, weight: .bold))
                    .foregroundStyle(theme.colors.danger)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .listRowBackground(
                theme.colors.surface
                    .overlay(Rectangle().stroke(theme.colors.danger.opacity(0.4), lineWidth: 2))
            )
            .listRowSeparator(.hidden)

            Button {
                showDeleteAccountConfirm = true
            } label: {
                Text(String(localized: "profile.delete_account"))
                    .font(.dotGothic(13))
                    .foregroundStyle(theme.colors.danger.opacity(0.65))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
        }
    }
}

private struct ProfileMemberRow: View {
    @Environment(ThemeManager.self) private var theme
    let member: FamilyMember

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Rectangle()
                    .fill(Color(hex: "#E8A04A"))
                    .frame(width: 36, height: 36)
                    .overlay(Rectangle().stroke(Color(hex: "#1A1630"), lineWidth: 2))
                    .shadow(color: Color(hex: "#1A1630").opacity(0.4), radius: 0, x: 2, y: 2)
                Text(initials)
                    .font(.pixelify(13, weight: .bold))
                    .foregroundStyle(Color(hex: "#1A1630"))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(member.name)
                    .font(.dotGothic(15))
                    .foregroundStyle(theme.colors.text)
                if let age = member.age {
                    Text("\(String(localized: "profile.member.age")): \(age)")
                        .font(.spaceGrotesk(.regular, size: 11))
                        .foregroundStyle(theme.colors.textMuted)
                }
            }
            Spacer()
        }
        .padding(.vertical, 8)
    }

    private var initials: String {
        let parts = member.name.trimmingCharacters(in: .whitespaces).split(separator: " ")
        let letters = parts.prefix(2).compactMap { $0.first.map(String.init) }
        return letters.joined().uppercased().isEmpty ? "?" : letters.joined().uppercased()
    }
}
