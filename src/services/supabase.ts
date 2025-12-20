import { createClient } from '@supabase/supabase-js'
import { Family, FamilyMember, InventoryItem } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using localStorage.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'

// Family operations
export async function getFamily(): Promise<Family | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const { data: familyData, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', DEFAULT_FAMILY_ID)
      .single()

    if (error) throw error

    if (!familyData) return null

    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', DEFAULT_FAMILY_ID)
      .order('created_at')

    if (membersError) throw membersError

    const members: FamilyMember[] = (membersData || []).map(m => ({
      id: m.id,
      name: m.name,
      age: m.age,
      dietaryRestrictions: m.dietary_restrictions || [],
      allergies: m.allergies || [],
      healthConditions: m.health_conditions || [],
      preferences: {
        spiceLevel: m.spice_level || 'mild',
        favoriteCuisines: m.favorite_cuisines || [],
        dislikedIngredients: m.disliked_ingredients || [],
      },
    }))

    const family: Family = {
      id: familyData.id,
      name: familyData.name,
      members,
      preferences: {
        cookingSkillLevel: familyData.cooking_skill_level,
        budgetRange: familyData.budget_range,
        preferredLanguage: familyData.preferred_language,
      },
      createdAt: familyData.created_at,
      updatedAt: familyData.updated_at,
    }

    return family
  } catch (error) {
    console.error('Error fetching family:', error)
    return null
  }
}

export async function updateFamily(family: Partial<Family>): Promise<Family | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const { error } = await supabase
      .from('families')
      .update({
        name: family.name,
        cooking_skill_level: family.preferences?.cookingSkillLevel,
        budget_range: family.preferences?.budgetRange,
        preferred_language: family.preferences?.preferredLanguage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', DEFAULT_FAMILY_ID)

    if (error) throw error

    return await getFamily()
  } catch (error) {
    console.error('Error updating family:', error)
    return null
  }
}

export async function updateFamilyMember(member: FamilyMember): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return

  try {
    const { error } = await supabase
      .from('family_members')
      .update({
        name: member.name,
        age: member.age,
        dietary_restrictions: member.dietaryRestrictions,
        allergies: member.allergies,
        health_conditions: member.healthConditions,
        spice_level: member.preferences.spiceLevel,
        favorite_cuisines: member.preferences.favoriteCuisines,
        disliked_ingredients: member.preferences.dislikedIngredients,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    if (error) throw error
  } catch (error) {
    console.error('Error updating member:', error)
  }
}

// Inventory operations
export async function getInventory(): Promise<InventoryItem[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const stored = localStorage.getItem('smart-fridge-inventory')
    return stored ? JSON.parse(stored) : []
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('family_id', DEFAULT_FAMILY_ID)
      .order('added_at', { ascending: false })

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category as InventoryItem['category'],
      quantity: item.quantity,
    }))
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const newItem: InventoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    const stored = localStorage.getItem('smart-fridge-inventory')
    const inventory = stored ? JSON.parse(stored) : []
    localStorage.setItem('smart-fridge-inventory', JSON.stringify([...inventory, newItem]))
    return newItem
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        family_id: DEFAULT_FAMILY_ID,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: 'piece',
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      category: data.category as InventoryItem['category'],
      quantity: data.quantity,
    }
  } catch (error) {
    console.error('Error adding inventory item:', error)
    throw error
  }
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const stored = localStorage.getItem('smart-fridge-inventory')
    const inventory = stored ? JSON.parse(stored) : []
    localStorage.setItem('smart-fridge-inventory', JSON.stringify(inventory.filter((i: InventoryItem) => i.id !== itemId)))
    return
  }

  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    throw error
  }
}

export async function updateInventoryItem(itemId: string, quantity: number): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const stored = localStorage.getItem('smart-fridge-inventory')
    const inventory = stored ? JSON.parse(stored) : []
    const updated = inventory.map((i: InventoryItem) => 
      i.id === itemId ? { ...i, quantity } : i
    )
    localStorage.setItem('smart-fridge-inventory', JSON.stringify(updated))
    return
  }

  try {
    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating inventory item:', error)
    throw error
  }
}

// Recipe operations
export async function getRecipeCost(recipeId: string): Promise<number | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('estimated_total_cost')
      .eq('id', recipeId)
      .single()

    if (error) throw error
    return data?.estimated_total_cost ? parseFloat(data.estimated_total_cost.toString()) : null
  } catch (error) {
    console.error('Error fetching recipe cost:', error)
    return null
  }
}

// Shopping list operations
export interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  unit: string
  is_purchased: boolean
  estimated_unit_cost: number | null
  alternatives: string[]
}

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []

  try {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('family_id', DEFAULT_FAMILY_ID)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_purchased: item.is_purchased || false,
      estimated_unit_cost: item.estimated_unit_cost ? parseFloat(item.estimated_unit_cost.toString()) : null,
      alternatives: item.alternatives || [],
    }))
  } catch (error) {
    console.error('Error fetching shopping list:', error)
    return []
  }
}

export async function updateShoppingListItem(itemId: string, isPurchased: boolean): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return

  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: isPurchased })
      .eq('id', itemId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating shopping list item:', error)
    throw error
  }
}

