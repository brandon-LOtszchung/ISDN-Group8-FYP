import { RecipeRequest, Recipe } from '@/types'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateRecipes(request: RecipeRequest): Promise<Recipe[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(request)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      return this.parseRecipeResponse(content, request)
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  private buildSystemPrompt(): string {
    return `You are a professional chef and nutritionist specializing in Hong Kong cuisine and international dishes. 
    You help families create delicious, healthy meals based on their available ingredients, dietary restrictions, and preferences.
    
    Always respond with valid JSON containing an array of recipe objects. Each recipe should include:
    - title: Clear, appetizing recipe name
    - description: Brief, enticing description
    - cuisine: One of the specified cuisine types
    - difficulty: easy, medium, or hard
    - cookingTime: Total time in minutes
    - servings: Number of people served
    - ingredients: Array with name, quantity, unit, and availability
    - instructions: Step-by-step cooking instructions
    - tags: Relevant tags (dietary, cooking method, etc.)
    
    Consider Hong Kong preferences, local ingredients, and family-friendly portions.
    Respect all dietary restrictions and allergies strictly.
    Provide 3-5 recipe options when possible.`
  }

  private buildUserPrompt(request: RecipeRequest): string {
    const {
      familyMembers,
      availableIngredients,
      cuisinePreferences,
      dietaryRestrictions,
      allergies,
      mealType,
      servings,
      maxCookingTime,
      difficulty,
    } = request

    return `Please suggest recipes for ${servings} people for ${mealType}.

Available ingredients: ${availableIngredients.join(', ')}

Family preferences:
- Cuisine types: ${cuisinePreferences.join(', ')}
- Dietary restrictions: ${dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
${maxCookingTime ? `- Maximum cooking time: ${maxCookingTime} minutes` : ''}
${difficulty ? `- Preferred difficulty: ${difficulty}` : ''}

Please prioritize recipes that:
1. Use as many available ingredients as possible
2. Are suitable for Hong Kong families
3. Respect all dietary restrictions and allergies
4. Match the preferred cuisine styles
5. Are appropriate for ${mealType}

Return only valid JSON with the recipe array.`
  }

  private parseRecipeResponse(content: string, request: RecipeRequest): Recipe[] {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      
      const recipes = Array.isArray(parsed) ? parsed : parsed.recipes || []
      
      return recipes.map((recipe: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        title: recipe.title || 'Untitled Recipe',
        description: recipe.description || '',
        cuisine: recipe.cuisine || request.cuisinePreferences[0] || 'fusion',
        difficulty: recipe.difficulty || 'medium',
        cookingTime: recipe.cookingTime || 30,
        servings: recipe.servings || request.servings,
        ingredients: this.processIngredients(recipe.ingredients || [], request.availableIngredients),
        instructions: recipe.instructions?.map((instruction: any, stepIndex: number) => ({
          step: stepIndex + 1,
          instruction: typeof instruction === 'string' ? instruction : instruction.instruction || '',
          duration: instruction.duration,
          temperature: instruction.temperature,
          imageUrl: instruction.imageUrl || instruction.photoUrl,
        })) || [],
        nutritionInfo: recipe.nutritionInfo,
        tags: recipe.tags || [],
        imageUrl: recipe.imageUrl,
        matchScore: 0,
        availableIngredients: 0,
        totalIngredients: 0,
      }))
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error)
      throw new Error('Failed to parse recipe suggestions')
    }
  }

  private processIngredients(ingredients: any[], availableIngredients: string[]) {
    return ingredients.map(ingredient => {
      const name = ingredient.name || ingredient
      const available = availableIngredients.some(available =>
        available.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(available.toLowerCase())
      )

      return {
        name,
        quantity: ingredient.quantity || 1,
        unit: ingredient.unit || 'piece',
        available,
        alternatives: ingredient.alternatives || [],
      }
    })
  }
}

export const openaiService = new OpenAIService(OPENAI_API_KEY || '')
export default openaiService
