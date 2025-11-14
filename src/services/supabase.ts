import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using mock data.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          cooking_skill_level: 'beginner' | 'intermediate' | 'advanced'
          budget_range: 'low' | 'medium' | 'high'
          preferred_language: 'en' | 'zh-HK' | 'fil' | 'id'
          meal_time_breakfast: string
          meal_time_lunch: string
          meal_time_dinner: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cooking_skill_level: 'beginner' | 'intermediate' | 'advanced'
          budget_range: 'low' | 'medium' | 'high'
          preferred_language: 'en' | 'zh-HK' | 'fil' | 'id'
          meal_time_breakfast?: string
          meal_time_lunch?: string
          meal_time_dinner?: string
        }
        Update: {
          name?: string
          cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced'
          budget_range?: 'low' | 'medium' | 'high'
          preferred_language?: 'en' | 'zh-HK' | 'fil' | 'id'
          meal_time_breakfast?: string
          meal_time_lunch?: string
          meal_time_dinner?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          name: string
          age: number
          dietary_restrictions: string[]
          allergies: string[]
          health_conditions: string[]
          spice_level: 'none' | 'mild' | 'medium' | 'hot'
          favorite_cuisines: string[]
          disliked_ingredients: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          age: number
          dietary_restrictions?: string[]
          allergies?: string[]
          health_conditions?: string[]
          spice_level?: 'none' | 'mild' | 'medium' | 'hot'
          favorite_cuisines?: string[]
          disliked_ingredients?: string[]
        }
        Update: {
          name?: string
          age?: number
          dietary_restrictions?: string[]
          allergies?: string[]
          health_conditions?: string[]
          spice_level?: 'none' | 'mild' | 'medium' | 'hot'
          favorite_cuisines?: string[]
          disliked_ingredients?: string[]
        }
      }
      inventory_items: {
        Row: {
          id: string
          family_id: string
          name: string
          category: string
          quantity: number
          unit: string
          expiry_date: string | null
          confidence: number
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          category: string
          quantity: number
          unit: string
          expiry_date?: string | null
          confidence?: number
        }
        Update: {
          name?: string
          category?: string
          quantity?: number
          unit?: string
          expiry_date?: string | null
          confidence?: number
        }
      }
      shopping_list_items: {
        Row: {
          id: string
          family_id: string
          name: string
          quantity: number
          unit: string
          alternatives: string[]
          is_purchased: boolean
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          quantity: number
          unit: string
          alternatives?: string[]
          is_purchased?: boolean
        }
        Update: {
          quantity?: number
          alternatives?: string[]
          is_purchased?: boolean
        }
      }
    }
  }
}

