import {
  CuisineType,
  DietaryRestriction,
  Allergy,
  HealthCondition,
} from '@/types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://159.223.45.101:8000'

export const CUISINE_OPTIONS: {
  value: CuisineType
  label: string
  emoji: string
}[] = [
  { value: 'chinese', label: 'Chinese', emoji: '🥢' },
  { value: 'cantonese', label: 'Cantonese', emoji: '🦐' },
  { value: 'sichuan', label: 'Sichuan', emoji: '🌶️' },
  { value: 'western', label: 'Western', emoji: '🍽️' },
  { value: 'italian', label: 'Italian', emoji: '🍝' },
  { value: 'japanese', label: 'Japanese', emoji: '🍣' },
  { value: 'korean', label: 'Korean', emoji: '🥘' },
  { value: 'thai', label: 'Thai', emoji: '🍜' },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'mexican', label: 'Mexican', emoji: '🌮' },
  { value: 'fusion', label: 'Fusion', emoji: '🌍' },
]

export const DIETARY_RESTRICTIONS: {
  value: DietaryRestriction
  label: string
}[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'low-sodium', label: 'Low Sodium' },
  { value: 'low-sugar', label: 'Low Sugar' },
  { value: 'low-fat', label: 'Low Fat' },
  { value: 'keto', label: 'Keto' },
  { value: 'gluten-free', label: 'Gluten Free' },
]

export const ALLERGY_OPTIONS: { value: Allergy; label: string }[] = [
  { value: 'nuts', label: 'Tree Nuts' },
  { value: 'peanuts', label: 'Peanuts' },
  { value: 'dairyAllergy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'fish', label: 'Fish' },
  { value: 'soy', label: 'Soy' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'sesame', label: 'Sesame' },
]

export const HEALTH_CONDITIONS: { value: HealthCondition; label: string }[] = [
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'High Blood Pressure' },
  { value: 'heart-disease', label: 'Heart Disease' },
  { value: 'kidney-disease', label: 'Kidney Disease' },
  { value: 'high-cholesterol', label: 'High Cholesterol' },
  { value: 'gout', label: 'Gout' },
]

export const SPICE_LEVELS = [
  { value: 'none', label: 'No Spice', emoji: '😌' },
  { value: 'mild', label: 'Mild', emoji: '🌶️' },
  { value: 'medium', label: 'Medium', emoji: '🌶️🌶️' },
  { value: 'hot', label: 'Hot', emoji: '🌶️🌶️🌶️' },
] as const

export const COOKING_SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Simple recipes with basic techniques' },
  { value: 'intermediate', label: 'Intermediate', description: 'Moderate complexity with some advanced techniques' },
  { value: 'advanced', label: 'Advanced', description: 'Complex recipes with professional techniques' },
] as const

export const BUDGET_RANGES = [
  { value: 'low', label: 'Budget-Friendly', description: 'Under HK$100 per meal' },
  { value: 'medium', label: 'Moderate', description: 'HK$100-200 per meal' },
  { value: 'high', label: 'Premium', description: 'Above HK$200 per meal' },
] as const

export const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '19:00',
}

export const STORAGE_KEYS = {
  FAMILY_DATA: 'smart-fridge-family',
  ONBOARDING_COMPLETED: 'smart-fridge-onboarding',
  FRIDGE_INITIALIZED: 'smart-fridge-initialized',
  INVENTORY: 'smart-fridge-inventory',
} as const
