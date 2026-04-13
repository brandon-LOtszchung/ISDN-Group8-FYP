// Views/Profile/MemberProfileView.swift
import SwiftUI

struct MemberProfileView: View {
    @Environment(AppViewModel.self) private var appVM
    @Environment(ThemeManager.self) private var theme
    @Environment(\.dismiss) private var dismiss

    /// nil = create mode, non-nil = edit mode
    let memberId: UUID?

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
        .navigationTitle(navigationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            cancelButtonIfNeeded
            ToolbarItem(placement: .confirmationAction) {
                Button(String(localized: "common.save"), action: save)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .onAppear(perform: load)
    }

    // MARK: - Private

    private var navigationTitle: String {
        if memberId == nil {
            return String(localized: "profile.member.add_title")
        }
        return name.isEmpty ? String(localized: "profile.member.title") : name
    }

    /// In create mode, show a Cancel button so the sheet can be dismissed without saving.
    @ToolbarContentBuilder
    private var cancelButtonIfNeeded: some ToolbarContent {
        if memberId == nil {
            ToolbarItem(placement: .cancellationAction) {
                Button(String(localized: "common.cancel")) { dismiss() }
            }
        }
    }

    private func load() {
        guard let id = memberId,
              let m = appVM.members.first(where: { $0.id == id }) else { return }
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
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let prefs = MemberPreferences(
            spiceLevel: spiceLevel,
            favoriteCuisines: Array(favoriteCuisines),
            dislikedIngredients: dislikedIngredients
        )

        if let id = memberId {
            // Edit mode
            guard var member = appVM.members.first(where: { $0.id == id }) else { return }
            member.name = trimmedName
            member.age = Int(ageText)
            member.dietaryRestrictions = Array(dietaryRestrictions)
            member.allergies = Array(allergies)
            member.healthConditions = Array(healthConditions)
            member.preferences = prefs
            appVM.updateMember(member)
        } else {
            // Create mode
            let member = FamilyMember(
                id: UUID(),
                familyId: Constants.defaultFamilyID,
                name: trimmedName,
                age: Int(ageText),
                dietaryRestrictions: Array(dietaryRestrictions),
                allergies: Array(allergies),
                healthConditions: Array(healthConditions),
                preferences: prefs
            )
            appVM.addMember(member)
        }
        dismiss()
    }
}
