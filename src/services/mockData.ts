import { Family, InventoryItem, Recipe, FamilyMember } from '@/types'
import { generateId } from '@/utils'

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'member-1',
    name: 'John',
    age: 35,
    dietaryRestrictions: [],
    allergies: ['nuts'],
    healthConditions: [],
    preferences: {
      spiceLevel: 'medium',
      favoriteCuisines: ['chinese', 'western'],
      dislikedIngredients: ['mushrooms'],
    },
  },
  {
    id: 'member-2',
    name: 'Mary',
    age: 32,
    dietaryRestrictions: ['vegetarian'],
    allergies: [],
    healthConditions: ['diabetes'],
    preferences: {
      spiceLevel: 'mild',
      favoriteCuisines: ['chinese', 'japanese'],
      dislikedIngredients: ['spicy food'],
    },
  },
  {
    id: 'member-3',
    name: 'Emma',
    age: 8,
    dietaryRestrictions: [],
    allergies: ['dairy'],
    healthConditions: [],
    preferences: {
      spiceLevel: 'none',
      favoriteCuisines: ['western', 'japanese'],
      dislikedIngredients: ['vegetables'],
    },
  },
]

export const mockFamily: Family = {
  id: 'family-1',
  name: 'The Lees',
  members: mockFamilyMembers,
  preferences: {
    cookingSkillLevel: 'intermediate',
    budgetRange: 'medium',
    mealTimes: {
      breakfast: '08:00',
      lunch: '12:30',
      dinner: '19:00',
    },
    preferredLanguage: 'en',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Chicken Breast',
    category: 'meat',
    quantity: 2,
    unit: 'pieces',
    expiryDate: '2024-01-15',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.95,
  },
  {
    id: 'inv-2',
    name: 'Broccoli',
    category: 'vegetables',
    quantity: 1,
    unit: 'head',
    expiryDate: '2024-01-12',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.92,
  },
  {
    id: 'inv-3',
    name: 'Rice',
    category: 'grains',
    quantity: 500,
    unit: 'g',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.98,
  },
  {
    id: 'inv-4',
    name: 'Soy Sauce',
    category: 'condiments',
    quantity: 1,
    unit: 'bottle',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.99,
  },
  {
    id: 'inv-5',
    name: 'Eggs',
    category: 'dairy',
    quantity: 6,
    unit: 'pieces',
    expiryDate: '2024-01-20',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.97,
  },
  {
    id: 'inv-6',
    name: 'Tomatoes',
    category: 'vegetables',
    quantity: 3,
    unit: 'pieces',
    expiryDate: '2024-01-14',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.94,
  },
  {
    id: 'inv-7',
    name: 'Onion',
    category: 'vegetables',
    quantity: 2,
    unit: 'pieces',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.96,
  },
  {
    id: 'inv-8',
    name: 'Garlic',
    category: 'vegetables',
    quantity: 1,
    unit: 'bulb',
    addedAt: '2024-01-10T10:00:00Z',
    confidence: 0.93,
  },
]

export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: 'Chicken and Broccoli Stir Fry',
    description: 'A simple and healthy stir fry with tender chicken and fresh broccoli',
    cuisine: 'chinese',
    difficulty: 'easy',
    cookingTime: 20,
    servings: 3,
    ingredients: [
      { name: 'Chicken Breast', quantity: 2, unit: 'pieces', available: true },
      { name: 'Broccoli', quantity: 1, unit: 'head', available: true },
      { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', available: true },
      { name: 'Garlic', quantity: 2, unit: 'cloves', available: true },
      { name: 'Rice', quantity: 1, unit: 'cup', available: true },
    ],
    instructions: [
      {
        step: 1,
        instruction: 'Cut chicken into bite-sized pieces',
        imageUrl:
          'https://images.unsplash.com/photo-1514516430032-7cce680f32a9?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 2,
        instruction: 'Cut broccoli into florets',
        imageUrl:
          'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 3,
        instruction: 'Heat oil in wok over high heat',
        imageUrl:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 4,
        instruction: 'Stir fry chicken until cooked through',
        imageUrl:
          'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 5,
        instruction: 'Add broccoli and garlic, stir fry for 2 minutes',
        imageUrl:
          'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 6,
        instruction: 'Add soy sauce and serve over rice',
        imageUrl:
          'https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?auto=format&fit=crop&w=800&q=80',
      },
    ],
    tags: ['quick', 'healthy', 'family-friendly'],
    matchScore: 100,
    availableIngredients: 5,
    totalIngredients: 5,
  },
  {
    id: 'recipe-2',
    title: 'Tomato and Egg Scramble',
    description: 'Classic Cantonese home-style dish with fresh tomatoes and fluffy eggs',
    cuisine: 'cantonese',
    difficulty: 'easy',
    cookingTime: 15,
    servings: 2,
    ingredients: [
      { name: 'Eggs', quantity: 4, unit: 'pieces', available: true },
      { name: 'Tomatoes', quantity: 2, unit: 'pieces', available: true },
      { name: 'Onion', quantity: 0.5, unit: 'piece', available: true },
      { name: 'Sugar', quantity: 1, unit: 'tsp', available: false },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', available: false },
    ],
    instructions: [
      {
        step: 1,
        instruction: 'Beat eggs with salt',
        imageUrl:
          'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 2,
        instruction: 'Cut tomatoes into wedges',
        imageUrl:
          'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 3,
        instruction: 'Dice onion finely',
        imageUrl:
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 4,
        instruction: 'Scramble eggs until just set, remove from pan',
        imageUrl:
          'https://images.unsplash.com/photo-1604908177522-4024aa3f27f8?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 5,
        instruction: 'Stir fry onion and tomatoes until soft',
        imageUrl:
          'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 6,
        instruction: 'Add eggs back and gently combine',
        imageUrl:
          'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80',
      },
    ],
    tags: ['comfort-food', 'quick', 'cantonese'],
    matchScore: 60,
    availableIngredients: 3,
    totalIngredients: 5,
  },
  {
    id: 'recipe-3',
    title: 'Simple Fried Rice',
    description: 'Easy fried rice using leftover rice and available ingredients',
    cuisine: 'chinese',
    difficulty: 'easy',
    cookingTime: 10,
    servings: 2,
    ingredients: [
      { name: 'Rice', quantity: 2, unit: 'cups', available: true },
      { name: 'Eggs', quantity: 2, unit: 'pieces', available: true },
      { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', available: true },
      { name: 'Garlic', quantity: 1, unit: 'clove', available: true },
      { name: 'Green Onions', quantity: 2, unit: 'stalks', available: false },
    ],
    instructions: [
      {
        step: 1,
        instruction: 'Heat oil in wok',
        imageUrl:
          'https://images.unsplash.com/photo-1514500422055-8b4f36c7b5d4?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 2,
        instruction: 'Scramble eggs and set aside',
        imageUrl:
          'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 3,
        instruction: 'Stir fry garlic until fragrant',
        imageUrl:
          'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 4,
        instruction: 'Add rice and break up clumps',
        imageUrl:
          'https://images.unsplash.com/photo-1604908554100-23c3d2b64bea?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 5,
        instruction: 'Add soy sauce and eggs',
        imageUrl:
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
      },
      {
        step: 6,
        instruction: 'Garnish with green onions if available',
        imageUrl:
          'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
      },
    ],
    tags: ['leftover-rice', 'quick', 'simple'],
    matchScore: 80,
    availableIngredients: 4,
    totalIngredients: 5,
  },
]

export const mockDataService = {
  async getFamily(): Promise<Family> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockFamily
  },

  async createFamily(family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<Family> {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      ...family,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async getInventory(): Promise<InventoryItem[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockInventory
  },

  async initializeFridge(): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { success: true, message: 'Fridge initialized successfully' }
  },

  async generateRecipes(availableIngredients: string[]): Promise<Recipe[]> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return mockRecipes.map(recipe => ({
      ...recipe,
      matchScore: Math.floor(Math.random() * 40) + 60,
    }))
  },
}
