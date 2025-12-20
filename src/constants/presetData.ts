import { Family } from '@/types'

// Preset family data for demo (Family ID: 00000000-0000-0000-0000-000000000001)
export const PRESET_FAMILY: Family = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'The Lee Family',
  members: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'John',
      age: 35,
      dietaryRestrictions: [],
      allergies: ['nuts'],
      healthConditions: [],
      preferences: {
        spiceLevel: 'medium',
        favoriteCuisines: ['chinese', 'western'],
        dislikedIngredients: [],
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'Mary',
      age: 32,
      dietaryRestrictions: ['vegetarian'],
      allergies: [],
      healthConditions: [],
      preferences: {
        spiceLevel: 'mild',
        favoriteCuisines: ['chinese', 'japanese'],
        dislikedIngredients: [],
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      name: 'Emma',
      age: 8,
      dietaryRestrictions: [],
      allergies: ['dairyAllergy'],
      healthConditions: [],
      preferences: {
        spiceLevel: 'none',
        favoriteCuisines: ['western', 'japanese'],
        dislikedIngredients: [],
      },
    },
  ],
  preferences: {
    cookingSkillLevel: 'intermediate',
    budgetRange: 'medium',
    preferredLanguage: 'zh-HK',
  },
  createdAt: '2025-11-14T01:14:47.921568Z',
  updatedAt: '2025-11-14T01:14:47.921568Z',
}

