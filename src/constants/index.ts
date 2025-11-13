import OnboardingComplete from '@/pages/onboarding/OnboardingComplete'
import {
  CuisineType,
  DietaryRestriction,
  Allergy,
  HealthCondition,
} from '@/types'

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
  { value: 'dairy', label: 'Dairy' },
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
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Simple recipes with basic techniques',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Moderate complexity with some advanced techniques',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Complex recipes with professional techniques',
  },
] as const

export const BUDGET_RANGES = [
  {
    value: 'low',
    label: 'Budget-Friendly',
    description: 'Under HK$100 per meal',
  },
  { value: 'medium', label: 'Moderate', description: 'HK$100-200 per meal' },
  { value: 'high', label: 'Premium', description: 'Above HK$200 per meal' },
] as const

export const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '19:00',
}

export const API_ENDPOINTS = {
  FAMILY: '/api/family',
  INVENTORY: '/api/inventory',
  RECIPES: '/api/recipes',
  GENERATE_RECIPES: '/api/recipes/generate',
} as const

export const STORAGE_KEYS = {
  FAMILY_DATA: 'smart-fridge-family',
  ONBOARDING_COMPLETED: 'smart-fridge-onboarding',
  FRIDGE_INITIALIZED: 'smart-fridge-initialized',
  USER_PREFERENCES: 'smart-fridge-preferences',
  SHOPPING_LIST: 'smart-fridge-shopping-list',
} as const

export const LOCALIZED_STRINGS = {
  en: {
    greeting: 'Hello',
    onboarding_tagline: 'Cooking inspiration, no more frustration!',
    onboarding_happy: 'Happy cooking every day!',
    onboarding_help:
      "Let's set up a personalized cooking assistant for your family",
    onboarding_familyName: 'Family Name',
    onboarding_familyNameExample: 'Example: Mr. and Mrs. Lee',
    onboarding_familyNumber: 'Number of family members',
    onboarding_include: 'Include adults and children',
    onboarding_startSetting: 'Start',
    OnboardingComplete: 'Complete',

    onboarding_familyMemberFirst: '1st Family Member',
    onboarding_familyMemberSecond: '2nd Family Member',
    onboarding_familyMemberThird: '3rd Family Member',
    onboarding_familyMemberFourth: '4th Family Member',
    onboarding_familyMemberFifth: '5th Family Member',
    onboarding_familyMemberSixth: '6th Family Member',
    onboarding_familyMemberName: 'Name',
    onboarding_familyMemberExample: 'Example: John, Jane',
    onboarding_familyMemberAge: 'Age',
    onboarding_familyMemberAgeSui: 'years old',
    onboarding_familyMemberHabit: 'Habit',
    onboarding_familyMemberAllergy: 'Allergy',
    onboarding_familyMemberOptional: '(Optional)',
    onboarding_familyMemberNext: 'Next',
    onboarding_others: 'Others',
  },
  'zh-HK': {
    greeting: '你好',
    onboarding_tagline: '煮食靈感不再煩惱！',
    onboarding_happy: '開心煮食每一天',
    onboarding_help: '讓我們為您的家庭設定個人化煮食助手',
    onboarding_familyName: '家庭稱呼',
    onboarding_familyNameExample: '例如：李太太一家',
    onboarding_familyNumber: '家中有幾多位成員？',
    onboarding_include: '包括大人同小朋友',
    onboarding_startSetting: '開始設定',
    OnboardingComplete: '完成',

    onboarding_familyMemberFirst: '第1位成員',
    onboarding_familyMemberSecond: '第2位成員',
    onboarding_familyMemberThird: '第3位成員',
    onboarding_familyMemberFourth: '第4位成員',
    onboarding_familyMemberFifth: '第5位成員',
    onboarding_familyMemberSixth: '第6位成員',
    onboarding_familyMemberName: '姓名',
    onboarding_familyMemberExample: '例如：阿明、媽媽',
    onboarding_familyMemberAge: '年齡',
    onboarding_familyMemberAgeSui: '歲',
    onboarding_familyMemberHabit: '飲食習慣',
    onboarding_familyMemberAllergy: '食物敏感',
    onboarding_familyMemberOptional: '（可選）',
    onboarding_familyMemberNext: '下一位',
    onboarding_others: '其他',
  },
  fil: {
    greeting: 'Kumusta',
    onboarding_tagline: 'Maghanap ng inspirasyon sa pagkain!',
    onboarding_happy: 'Magandang pagkain sa bawat araw!',
    onboarding_help:
      'Mag-set up tayo ng personalized na katulong sa pagluluto para sa iyong pamilya',
    onboarding_familyName: 'Pamilya na pangalan',
    onboarding_familyNameExample: 'Halimbawa: G. at Gng. Lee',
    onboarding_familyNumber: 'Bilang ng mga miyembro ng pamilya',
    onboarding_include: 'Isama ang mga matatanda at bata',
    onboarding_startSetting: 'Simulan ang Setting',
    OnboardingComplete: 'Tandaan na na-termina ang proseso ng pagpapakita!',

    onboarding_familyMemberFirst: 'Unang Miyembro ng Pamilya',
    onboarding_familyMemberSecond: 'Ikalawang Miyembro ng Pamilya',
    onboarding_familyMemberThird: 'Ikatlong Miyembro ng Pamilya',
    onboarding_familyMemberFourth: 'Ikalawang Miyembro ng Pamilya',
    onboarding_familyMemberFifth: 'Ikatlong Miyembro ng Pamilya',
    onboarding_familyMemberSixth: 'Ikalawang Miyembro ng Pamilya',
    onboarding_familyMemberName: 'Pangalan',
    onboarding_familyMemberExample: 'Halimbawa: Juan, Maria',
    onboarding_familyMemberAge: 'Umang',
    onboarding_familyMemberAgeSui: 'taong gulang',
    onboarding_familyMemberHabit: 'Ugali',
    onboarding_familyMemberAllergy: 'Allergy',
    onboarding_familyMemberOptional: '(opsyonal)',
    onboarding_familyMemberNext: 'Susunod',
    onboarding_others: 'Iba',
  },
} as const
