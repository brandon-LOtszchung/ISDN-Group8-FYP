import { supabase } from './supabase'
import { Family, InventoryItem, RecipeIngredient } from '@/types'

const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export const familyService = {
  async getFamily(familyId: string): Promise<Family | null> {
    if (!isSupabaseConfigured()) return null

    const { data, error } = await supabase
      .from('families')
      .select(`*, members:family_members(*)`)
      .eq('id', familyId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      members: data.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        age: m.age,
        dietaryRestrictions: m.dietary_restrictions,
        allergies: m.allergies,
        healthConditions: m.health_conditions,
        preferences: {
          spiceLevel: m.spice_level,
          favoriteCuisines: m.favorite_cuisines,
          dislikedIngredients: m.disliked_ingredients,
        },
      })),
      preferences: {
        cookingSkillLevel: data.cooking_skill_level,
        budgetRange: data.budget_range,
        mealTimes: {
          breakfast: data.meal_time_breakfast,
          lunch: data.meal_time_lunch,
          dinner: data.meal_time_dinner,
        },
        preferredLanguage: data.preferred_language,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async getDefaultFamily(): Promise<Family | null> {
    if (!isSupabaseConfigured()) return null

    const { data, error } = await supabase
      .from('families')
      .select(`*, members:family_members(*)`)
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      members: data.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        age: m.age,
        dietaryRestrictions: m.dietary_restrictions,
        allergies: m.allergies,
        healthConditions: m.health_conditions,
        preferences: {
          spiceLevel: m.spice_level,
          favoriteCuisines: m.favorite_cuisines,
          dislikedIngredients: m.disliked_ingredients,
        },
      })),
      preferences: {
        cookingSkillLevel: data.cooking_skill_level,
        budgetRange: data.budget_range,
        mealTimes: {
          breakfast: data.meal_time_breakfast,
          lunch: data.meal_time_lunch,
          dinner: data.meal_time_dinner,
        },
        preferredLanguage: data.preferred_language,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async createFamily(family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<Family> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }

    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name: family.name,
        cooking_skill_level: family.preferences.cookingSkillLevel,
        budget_range: family.preferences.budgetRange,
        preferred_language: family.preferences.preferredLanguage,
        meal_time_breakfast: family.preferences.mealTimes.breakfast,
        meal_time_lunch: family.preferences.mealTimes.lunch,
        meal_time_dinner: family.preferences.mealTimes.dinner,
      })
      .select()
      .single()

    if (familyError) throw familyError

    const membersToInsert = family.members.map((member) => ({
      family_id: familyData.id,
      name: member.name,
      age: member.age,
      dietary_restrictions: member.dietaryRestrictions,
      allergies: member.allergies,
      health_conditions: member.healthConditions,
      spice_level: member.preferences.spiceLevel,
      favorite_cuisines: member.preferences.favoriteCuisines,
      disliked_ingredients: member.preferences.dislikedIngredients,
    }))

    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .insert(membersToInsert)
      .select()

    if (membersError) throw membersError

    return {
      id: familyData.id,
      name: familyData.name,
      members: membersData.map((m) => ({
        id: m.id,
        name: m.name,
        age: m.age,
        dietaryRestrictions: m.dietary_restrictions,
        allergies: m.allergies,
        healthConditions: m.health_conditions,
        preferences: {
          spiceLevel: m.spice_level,
          favoriteCuisines: m.favorite_cuisines,
          dislikedIngredients: m.disliked_ingredients,
        },
      })),
      preferences: {
        cookingSkillLevel: familyData.cooking_skill_level,
        budgetRange: familyData.budget_range,
        mealTimes: {
          breakfast: familyData.meal_time_breakfast,
          lunch: familyData.meal_time_lunch,
          dinner: familyData.meal_time_dinner,
        },
        preferredLanguage: familyData.preferred_language,
      },
      createdAt: familyData.created_at,
      updatedAt: familyData.updated_at,
    }
  },

  async updateFamily(familyId: string, family: Partial<Family>): Promise<Family> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase
      .from('families')
      .update({
        name: family.name,
        cooking_skill_level: family.preferences?.cookingSkillLevel,
        budget_range: family.preferences?.budgetRange,
        preferred_language: family.preferences?.preferredLanguage,
      })
      .eq('id', familyId)

    if (error) throw error

    return this.getFamily(familyId) as Promise<Family>
  },
}

export const inventoryService = {
  async getInventory(familyId: string): Promise<InventoryItem[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('family_id', familyId)
      .order('category')

    if (error) throw error

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
    }))
  },

  async addItem(familyId: string, item: Omit<InventoryItem, 'id'> | InventoryItem): Promise<InventoryItem> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        family_id: familyId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
    }
  },

  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<void> {
    if (!isSupabaseConfigured()) return

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity: updates.quantity })
      .eq('id', itemId)

    if (error) throw error
  },

  async deleteItem(itemId: string): Promise<void> {
    if (!isSupabaseConfigured()) return

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },
}

export const shoppingListService = {
  async getShoppingList(familyId: string): Promise<RecipeIngredient[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_purchased', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      available: false,
      alternatives: item.alternatives || [],
    }))
  },

  async addItems(familyId: string, items: RecipeIngredient[]): Promise<void> {
    if (!isSupabaseConfigured()) return

    const itemsToInsert = items.map((item) => ({
      family_id: familyId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      alternatives: item.alternatives || [],
    }))

    const { error } = await supabase
      .from('shopping_list_items')
      .upsert(itemsToInsert, { onConflict: 'family_id,name,unit', ignoreDuplicates: false })

    if (error) throw error
  },

  async removeItem(familyId: string, name: string, unit: string): Promise<void> {
    if (!isSupabaseConfigured()) return

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('family_id', familyId)
      .eq('name', name)
      .eq('unit', unit)

    if (error) throw error
  },

  async clearList(familyId: string): Promise<void> {
    if (!isSupabaseConfigured()) return

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('family_id', familyId)

    if (error) throw error
  },
}
