import { Family, InventoryItem, Recipe, RecipeIngredient, CuisineType, DietaryRestriction, Allergy } from '@/types'
import { mockDataService } from './mockData'
import { familyService, inventoryService, shoppingListService } from './database'
import { recipeService } from './recipeService'

// Check if Supabase is configured
const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Default family ID for MVP (single family mode)
const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Unified Data Service
 * Automatically switches between Supabase and Mock Data
 */
export const dataService = {
  /**
   * Get or create the default family
   */
  async getFamily(): Promise<Family> {
    if (USE_SUPABASE) {
      try {
        const family = await familyService.getDefaultFamily()
        if (family) return family
      } catch (error) {
        console.error('Supabase error, falling back to mock:', error)
      }
    }
    
    // Fallback to mock data
    return mockDataService.getFamily()
  },

  /**
   * Create a new family
   */
  async createFamily(family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<Family> {
    if (USE_SUPABASE) {
      try {
        return await familyService.createFamily(family)
      } catch (error) {
        console.error('Supabase error, falling back to mock:', error)
      }
    }
    
    // Fallback to mock data
    return mockDataService.createFamily(family)
  },

  /**
   * Update family preferences
   */
  async updateFamily(familyId: string, family: Partial<Family>): Promise<Family> {
    if (USE_SUPABASE) {
      try {
        return await familyService.updateFamily(familyId, family)
      } catch (error) {
        console.error('Supabase error, falling back to mock:', error)
      }
    }
    
    // For mock, just return the family as-is
    return family as Family
  },

  /**
   * Get current inventory
   */
  async getInventory(): Promise<InventoryItem[]> {
    if (USE_SUPABASE) {
      try {
        return await inventoryService.getInventory(DEFAULT_FAMILY_ID)
      } catch (error) {
        console.error('Supabase error, falling back to mock:', error)
      }
    }
    
    // Fallback to mock data
    return mockDataService.getInventory()
  },

  /**
   * Initialize fridge (placeholder for sensor integration)
   */
  async initializeFridge(): Promise<{ success: boolean; message: string }> {
    // This would integrate with your hardware sensors
    // For now, just simulate the initialization
    return mockDataService.initializeFridge()
  },

  /**
   * Add inventory item
   */
  async addInventoryItem(familyId: string, item: Omit<InventoryItem, 'id' | 'addedAt' | 'confidence'>): Promise<InventoryItem> {
    if (USE_SUPABASE) {
      try {
        return await inventoryService.addItem(familyId, item)
      } catch (error) {
        console.error('Failed to add item to Supabase:', error)
        throw error
      }
    }
    
    throw new Error('Supabase not configured')
  },

  /**
   * Remove inventory item
   */
  async removeInventoryItem(itemId: string): Promise<void> {
    if (USE_SUPABASE) {
      try {
        await inventoryService.deleteItem(itemId)
      } catch (error) {
        console.error('Failed to remove item from Supabase:', error)
        throw error
      }
    }
  },

  /**
   * Generate recipe recommendations using AI
   */
  async generateRecipes(
    availableIngredients: string[],
    cuisineTypes: CuisineType[],
    dietaryRestrictions: DietaryRestriction[] = [],
    allergies: Allergy[] = [],
    servings: number = 4
  ): Promise<Recipe[]> {
    const USE_AI = !!(import.meta.env.VITE_OPENAI_API_KEY)
    
    if (USE_AI) {
      try {
        return await recipeService.generateRecipes({
          availableIngredients,
          cuisineTypes,
          dietaryRestrictions,
          allergies,
          servings,
        })
      } catch (error) {
        console.error('AI recipe generation failed, falling back to mock:', error)
      }
    }
    
    // Fallback to mock data
    return mockDataService.generateRecipes(availableIngredients)
  },

  /**
   * Get shopping list
   */
  async getShoppingList(): Promise<RecipeIngredient[]> {
    if (USE_SUPABASE) {
      try {
        return await shoppingListService.getShoppingList(DEFAULT_FAMILY_ID)
      } catch (error) {
        console.error('Supabase error:', error)
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('smart-fridge-shopping-list')
    return stored ? JSON.parse(stored) : []
  },

  /**
   * Add items to shopping list
   */
  async addToShoppingList(items: RecipeIngredient[]): Promise<void> {
    if (USE_SUPABASE) {
      try {
        await shoppingListService.addItems(DEFAULT_FAMILY_ID, items)
        return
      } catch (error) {
        console.error('Supabase error:', error)
      }
    }
    
    // Fallback to localStorage (handled by AppContext)
  },

  /**
   * Remove item from shopping list
   */
  async removeFromShoppingList(name: string, unit: string): Promise<void> {
    if (USE_SUPABASE) {
      try {
        await shoppingListService.removeItem(DEFAULT_FAMILY_ID, name, unit)
        return
      } catch (error) {
        console.error('Supabase error:', error)
      }
    }
    
    // Fallback to localStorage (handled by AppContext)
  },

  /**
   * Clear shopping list
   */
  async clearShoppingList(): Promise<void> {
    if (USE_SUPABASE) {
      try {
        await shoppingListService.clearList(DEFAULT_FAMILY_ID)
        return
      } catch (error) {
        console.error('Supabase error:', error)
      }
    }
    
    // Fallback to localStorage (handled by AppContext)
  },
}

export default dataService

