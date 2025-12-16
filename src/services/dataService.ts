import { Family, InventoryItem, Recipe, RecipeIngredient, CuisineType, DietaryRestriction, Allergy } from '@/types'
import { familyService, inventoryService, shoppingListService } from './database'

const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'

export const dataService = {
  async getFamily(): Promise<Family | null> {
    if (!USE_SUPABASE) return null
    return familyService.getDefaultFamily()
  },

  async createFamily(family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<Family> {
    if (!USE_SUPABASE) {
      throw new Error('Database not configured')
    }
    return familyService.createFamily(family)
  },

  async updateFamily(familyId: string, family: Partial<Family>): Promise<Family> {
    if (!USE_SUPABASE) {
      throw new Error('Database not configured')
    }
    return familyService.updateFamily(familyId, family)
  },

  async getInventory(): Promise<InventoryItem[]> {
    if (!USE_SUPABASE) return []
    return inventoryService.getInventory(DEFAULT_FAMILY_ID)
  },

  async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    if (!USE_SUPABASE) {
      throw new Error('Database not configured')
    }
    return inventoryService.addItem(DEFAULT_FAMILY_ID, item)
  },

  async addInventoryItems(items: InventoryItem[]): Promise<void> {
    if (!USE_SUPABASE) {
      throw new Error('Database not configured')
    }
    for (const item of items) {
      await inventoryService.addItem(DEFAULT_FAMILY_ID, item)
    }
  },

  async removeInventoryItem(itemId: string): Promise<void> {
    if (!USE_SUPABASE) return
    await inventoryService.deleteItem(itemId)
  },

  async generateRecipes(
    _availableIngredients: string[],
    _cuisineTypes: CuisineType[],
    _dietaryRestrictions: DietaryRestriction[] = [],
    _allergies: Allergy[] = [],
    _servings: number = 4
  ): Promise<Recipe[]> {
    // TODO: Integrate with recipe API endpoint when available
    return []
  },

  async getShoppingList(): Promise<RecipeIngredient[]> {
    if (!USE_SUPABASE) {
      const stored = localStorage.getItem('smart-fridge-shopping-list')
      return stored ? JSON.parse(stored) : []
    }
    return shoppingListService.getShoppingList(DEFAULT_FAMILY_ID)
  },

  async addToShoppingList(items: RecipeIngredient[]): Promise<void> {
    if (!USE_SUPABASE) return
    await shoppingListService.addItems(DEFAULT_FAMILY_ID, items)
  },

  async removeFromShoppingList(name: string, unit: string): Promise<void> {
    if (!USE_SUPABASE) return
    await shoppingListService.removeItem(DEFAULT_FAMILY_ID, name, unit)
  },

  async clearShoppingList(): Promise<void> {
    if (!USE_SUPABASE) return
    await shoppingListService.clearList(DEFAULT_FAMILY_ID)
  },
}

export default dataService
