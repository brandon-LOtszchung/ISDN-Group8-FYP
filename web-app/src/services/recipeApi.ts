const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://159.223.45.101:8000'

export interface RecipeRecommendation {
  saved_recipe_id: string
  name: string
  cuisine_style: string
  matched_count: number
  total_count: number
  missing_count: number
}

export interface RecipeRecommendResponse {
  success: boolean
  recipes: RecipeRecommendation[]
}

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
  required: boolean
}

export interface MissingIngredient {
  name: string
  quantity: number
  unit: string
  alternatives: string[]
}

export interface RecipeDetail {
  saved_recipe_id: string
  name: string
  cuisine_style: string
  matched_count: number
  total_count: number
  ingredients: RecipeIngredient[]
  steps: string[]
  missing_ingredients: MissingIngredient[]
}

export interface RecipeDetailResponse {
  success: boolean
  recipe: RecipeDetail
}

export interface AddToShoppingListResponse {
  success: boolean
  added: MissingIngredient[]
}

/**
 * Get recipe recommendations based on selected members and cuisine
 */
export async function recommendRecipes(
  memberIds: string[],
  cuisineStyle: string
): Promise<RecipeRecommendation[]> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      member_ids: memberIds,
      cuisine_style: cuisineStyle,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to get recipe recommendations')
  }

  const data: RecipeRecommendResponse = await response.json()
  
  if (!data.success) {
    throw new Error('Failed to get recipe recommendations')
  }

  return data.recipes
}

/**
 * Get detailed recipe information by recipe ID
 */
export async function getRecipeDetail(recipeId: string): Promise<RecipeDetail> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to get recipe details')
  }

  const data: RecipeDetailResponse = await response.json()

  if (!data.success) {
    throw new Error('Failed to get recipe details')
  }

  return data.recipe
}

/**
 * Add missing ingredients to shopping list
 */
export async function addToShoppingList(recipeId: string): Promise<MissingIngredient[]> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/add-to-shopping-list`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to add to shopping list')
  }

  const data: AddToShoppingListResponse = await response.json()

  if (!data.success) {
    throw new Error('Failed to add to shopping list')
  }

  return data.added
}

