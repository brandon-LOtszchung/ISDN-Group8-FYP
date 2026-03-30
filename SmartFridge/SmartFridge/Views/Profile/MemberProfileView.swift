// Views/Profile/MemberProfileView.swift
import SwiftUI

struct MemberProfileView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(\.dismiss) private var dismiss

    let memberId: UUID

    @State private var name = ""
    @State private var ageText = ""
    @State private var dietaryRestrictions: Set<String> = []
    @State private var allergies: Set<String> = []
    @State private var healthConditions: Set<String> = []
    @State private var spiceLevel: String? = nil
    @State private var favoriteCuisines: Set<String> = []
    @State private var dislikedIngredients: [String] = []
    @State private var newIngredient = ""

    var body: some View {
        Form {
            Section(String(localized: "profile.member.section.basic")) {
                TextField(String(localized: "profile.member.name"), text: $name)
                HStack {
                    Text(String(localized: "profile.member.age"))
                    Spacer()
                    TextField(String(localized: "profile.member.age.hint"), text: $ageText)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
            }

            Section(String(localized: "profile.member.dietary")) {
                FlowLayout(spacing: 8) {
                    ForEach(Constants.dietaryRestrictions, id: \.self) { option in
                        PillView(label: option, isSelected: dietaryRestrictions.contains(option)) {
                            toggleSet(&dietaryRestrictions, value: option)
                        }
                    }
                }
                .padding(.vertical, 4)
            }

            Section(String(localized: "profile.member.allergies")) {
                FlowLayout(spacing: 8) {
                    ForEach(Constants.allergies, id: \.self) { option in
                        PillView(label: option, isSelected: allergies.contains(option)) {
                            toggleSet(&allergies, value: option)
                        }
                    }
                }
                .padding(.vertical, 4)
            }

            Section(String(localized: "profile.member.health")) {
                FlowLayout(spacing: 8) {
                    ForEach(Constants.healthConditions, id: \.self) { option in
                        PillView(label: option, isSelected: healthConditions.contains(option)) {
                            toggleSet(&healthConditions, value: option)
                        }
                    }
                }
                .padding(.vertical, 4)
            }

            Section(String(localized: "profile.member.preferences")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "profile.member.spice"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    FlowLayout(spacing: 8) {
                        ForEach(Constants.spiceLevels, id: \.self) { level in
                            PillView(label: level.capitalized, isSelected: spiceLevel == level) {
                                spiceLevel = spiceLevel == level ? nil : level
                            }
                        }
                    }
                }
                .padding(.vertical, 4)

                VStack(alignment: .leading, spacing: 8) {
                    Text(String(localized: "profile.member.cuisines"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    FlowLayout(spacing: 8) {
                        ForEach(Constants.cuisineOptions) { cuisine in
                            PillView(label: cuisine.label, isSelected: favoriteCuisines.contains(cuisine.value)) {
                                toggleSet(&favoriteCuisines, value: cuisine.value)
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
            }

            Section(String(localized: "profile.member.disliked")) {
                ForEach(dislikedIngredients, id: \.self) { ingredient in
                    Text(ingredient)
                }
                .onDelete { offsets in
                    dislikedIngredients.remove(atOffsets: offsets)
                }
                HStack {
                    TextField(String(localized: "profile.member.add_disliked"), text: $newIngredient)
                        .submitLabel(.done)
                        .onSubmit(addIngredient)
                    Button(action: addIngredient) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(theme.colors.primary)
                    }
                    .buttonStyle(.plain)
                    .disabled(newIngredient.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .navigationTitle(name.isEmpty ? String(localized: "profile.member.title") : name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(String(localized: "common.save"), action: save)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .onAppear(perform: load)
    }

    // MARK: - Private

    private func load() {
        guard let m = appVM.members.first(where: { $0.id == memberId }) else { return }
        name = m.name
        ageText = m.age.map(String.init) ?? ""
        dietaryRestrictions = Set(m.dietaryRestrictions)
        allergies = Set(m.allergies)
        healthConditions = Set(m.healthConditions)
        spiceLevel = m.preferences.spiceLevel
        favoriteCuisines = Set(m.preferences.favoriteCuisines)
        dislikedIngredients = m.preferences.dislikedIngredients
    }

    private func toggleSet(_ set: inout Set<String>, value: String) {
        if set.contains(value) { set.remove(value) } else { set.insert(value) }
    }

    private func addIngredient() {
        let trimmed = newIngredient.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !dislikedIngredients.contains(trimmed) else { return }
        dislikedIngredients.append(trimmed)
        newIngredient = ""
    }

    private func save() {
        guard var member = appVM.members.first(where: { $0.id == memberId }) else { return }
        member.name = name.trimmingCharacters(in: .whitespaces)
        member.age = Int(ageText)
        member.dietaryRestrictions = Array(dietaryRestrictions)
        member.allergies = Array(allergies)
        member.healthConditions = Array(healthConditions)
        member.preferences = MemberPreferences(
            spiceLevel: spiceLevel,
            favoriteCuisines: Array(favoriteCuisines),
            dislikedIngredients: dislikedIngredients
        )
        appVM.updateMember(member)
        dismiss()
    }
}
