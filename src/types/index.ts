export type InterfaceLanguage = 'en' | 'zh-HK' | 'fil'

export interface FamilyMember {
  id: string
  name: string
  age: number
  dietaryRestrictions: DietaryRestriction[]
  allergies: Allergy[]
  healthConditions: HealthCondition[]
  preferences: MemberPreferences
}

export interface MemberPreferences {
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot'
  favoriteCuisines: CuisineType[]
  dislikedIngredients: string[]
}

export interface Family {
  id: string
  name: string
  members: FamilyMember[]
  preferences: FamilyPreferences
  createdAt: string
  updatedAt: string
}

export interface FamilyPreferences {
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced'
  budgetRange: 'low' | 'medium' | 'high'
  mealTimes: {
    breakfast: string
    lunch: string
    dinner: string
  }
  preferredLanguage: 'en' | 'zh-HK' | 'fil'
}

export interface InventoryItem {
  id: string
  name: string
  category: ItemCategory
  quantity: number
  unit: string
  expiryDate?: string
  addedAt: string
  confidence: number
}

export interface Recipe {
  id: string
  title: string
  description: string
  cuisine: CuisineType
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
  servings: number
  ingredients: RecipeIngredient[]
  instructions: RecipeStep[]
  nutritionInfo?: NutritionInfo
  tags: string[]
  imageUrl?: string
  matchScore: number
  availableIngredients: number
  totalIngredients: number
}

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
  available: boolean
  alternatives?: string[]
}

export interface RecipeStep {
  step: number
  instruction: string
  duration?: number
  temperature?: number
  imageUrl?: string
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

export interface RecipeRequest {
  familyMembers: string[]
  availableIngredients: string[]
  cuisinePreferences: CuisineType[]
  dietaryRestrictions: DietaryRestriction[]
  allergies: Allergy[]
  mealType: MealType
  servings: number
  maxCookingTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

export type CuisineType =
  | 'chinese'
  | 'cantonese'
  | 'sichuan'
  | 'western'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'thai'
  | 'vietnamese'
  | 'indian'
  | 'mexican'
  | 'fusion'

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'halal'
  | 'kosher'
  | 'low-sodium'
  | 'low-sugar'
  | 'low-fat'
  | 'keto'
  | 'gluten-free'

export type Allergy =
  | 'nuts'
  | 'peanuts'
  | 'dairy'
  | 'eggs'
  | 'shellfish'
  | 'fish'
  | 'soy'
  | 'wheat'
  | 'sesame'

export type HealthCondition =
  | 'diabetes'
  | 'hypertension'
  | 'heart-disease'
  | 'kidney-disease'
  | 'high-cholesterol'
  | 'gout'

export type ItemCategory =
  | 'vegetables'
  | 'fruits'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'grains'
  | 'condiments'
  | 'beverages'
  | 'snacks'
  | 'frozen'
  | 'canned'
  | 'other'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface AppState {
  preferredLanguage: InterfaceLanguage
  family: Family | null
  inventory: InventoryItem[]
  currentRecipes: Recipe[]
  shoppingList: RecipeIngredient[]
  isLoading: boolean
  error: string | null
  onboardingCompleted: boolean
  fridgeInitialized: boolean
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
