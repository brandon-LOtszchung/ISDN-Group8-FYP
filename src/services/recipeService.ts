import { Recipe, RecipeIngredient, RecipeStep, CuisineType, DietaryRestriction, Allergy } from '@/types'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

interface RecipeGenerationRequest {
  availableIngredients: string[]
  cuisineTypes: CuisineType[]
  dietaryRestrictions: DietaryRestriction[]
  allergies: Allergy[]
  servings: number
}

interface OpenAIRecipe {
  title: string
  description: string
  cuisine: CuisineType
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
  servings: number
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    alternatives?: string[]
  }>
  instructions: Array<{
    instruction: string
    duration?: number
    temperature?: number
  }>
  tags: string[]
}

/**
 * Recipe Generation Service - Uses OpenAI to generate personalized recipes
 */
export class RecipeService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate recipes based on available ingredients and preferences
   */
  async generateRecipes(request: RecipeGenerationRequest): Promise<Recipe[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = this.buildPrompt(request)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Faster and cheaper for text generation
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7, // Creative but not too random
          max_tokens: 3000,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      return this.parseRecipeResponse(content, request)
    } catch (error) {
      console.error('Recipe generation error:', error)
      throw error
    }
  }

  /**
   * System prompt - Defines AI's role and behavior
   */
  private getSystemPrompt(): string {
    return `You are an expert chef and nutritionist specializing in Hong Kong home cooking and international cuisines.

Your task is to generate practical, family-friendly recipes based on available ingredients.

RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. Generate 3-5 diverse recipe options
3. Use as many available ingredients as possible
4. STRICTLY respect all dietary restrictions and allergies
5. Be specific with ingredient names and quantities
6. Provide clear, step-by-step instructions
7. Consider Hong Kong preferences and local ingredients
8. Make recipes practical for home cooking

Output format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "cuisine": "chinese|western|japanese|etc",
      "difficulty": "easy|medium|hard",
      "cookingTime": 30,
      "servings": 4,
      "ingredients": [
        {"name": "Chicken Breast", "quantity": 2, "unit": "pieces", "alternatives": ["Pork", "Tofu"]}
      ],
      "instructions": [
        {"instruction": "Step description", "duration": 5, "temperature": 180}
      ],
      "tags": ["quick", "healthy", "family-friendly"]
    }
  ]
}`
  }

  /**
   * Build user prompt with specific requirements
   */
  private buildPrompt(request: RecipeGenerationRequest): string {
    const {
      availableIngredients,
      cuisineTypes,
      dietaryRestrictions,
      allergies,
      servings,
    } = request

    return `Generate ${3} recipes for ${servings} people with these requirements:

AVAILABLE INGREDIENTS:
${availableIngredients.map(ing => `- ${ing}`).join('\n')}

CUISINE PREFERENCES:
${cuisineTypes.map(c => `- ${c}`).join('\n')}

${dietaryRestrictions.length > 0 ? `DIETARY RESTRICTIONS (MUST FOLLOW):
${dietaryRestrictions.map(d => `- ${d}`).join('\n')}` : ''}

${allergies.length > 0 ? `ALLERGIES (MUST AVOID):
${allergies.map(a => `- ${a.replace('Allergy', '')}`).join('\n')}` : ''}

REQUIREMENTS:
1. Prioritize using available ingredients
2. Suggest realistic alternatives for missing ingredients
3. Make recipes suitable for Hong Kong families
4. Consider the selected cuisine styles
5. Provide clear, numbered cooking steps
6. Include estimated cooking times
7. Add relevant tags (quick, healthy, budget-friendly, etc.)

Return ONLY the JSON response, no other text.`
  }

  /**
   * Parse OpenAI response and check ingredient availability
   */
  private parseRecipeResponse(content: string, request: RecipeGenerationRequest): Recipe[] {
    try {
      // Clean response (remove markdown if present)
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      
      const recipes = parsed.recipes || (Array.isArray(parsed) ? parsed : [])
      
      return recipes.map((recipe: OpenAIRecipe, index: number) => {
        // Process ingredients and check availability
        const processedIngredients = this.processIngredients(
          recipe.ingredients || [],
          request.availableIngredients
        )

        const availableCount = processedIngredients.filter(ing => ing.available).length
        const totalCount = processedIngredients.length
        const matchScore = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0

        return {
          id: `ai-${Date.now()}-${index}`,
          title: recipe.title || 'Untitled Recipe',
          description: recipe.description || '',
          cuisine: this.validateCuisine(recipe.cuisine, request.cuisineTypes),
          difficulty: recipe.difficulty || 'medium',
          cookingTime: recipe.cookingTime || 30,
          servings: recipe.servings || request.servings,
          ingredients: processedIngredients,
          instructions: this.processInstructions(recipe.instructions || []),
          nutritionInfo: undefined,
          tags: recipe.tags || [],
          imageUrl: undefined,
          matchScore,
          availableIngredients: availableCount,
          totalIngredients: totalCount,
        }
      })
    } catch (error) {
      console.error('Failed to parse recipe response:', error)
      throw new Error('Failed to parse AI response. Please try again.')
    }
  }

  /**
   * Check which ingredients are available
   */
  private processIngredients(
    ingredients: Array<{ name: string; quantity: number; unit: string; alternatives?: string[] }>,
    availableIngredients: string[]
  ): RecipeIngredient[] {
    return ingredients.map(ing => {
      const available = availableIngredients.some(avail =>
        avail.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(avail.toLowerCase())
      )

      return {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        available,
        alternatives: ing.alternatives || [],
      }
    })
  }

  /**
   * Convert instruction objects to RecipeStep format
   */
  private processInstructions(instructions: Array<{ instruction: string; duration?: number; temperature?: number }>): RecipeStep[] {
    return instructions.map((inst, index) => ({
      step: index + 1,
      instruction: inst.instruction,
      duration: inst.duration,
      temperature: inst.temperature,
      imageUrl: undefined,
    }))
  }

  /**
   * Validate cuisine type
   */
  private validateCuisine(cuisine: string, preferredCuisines: CuisineType[]): CuisineType {
    const validCuisines: CuisineType[] = [
      'chinese', 'cantonese', 'sichuan', 'western', 'italian', 
      'japanese', 'korean', 'thai', 'vietnamese', 'indian', 'mexican', 'fusion'
    ]
    
    const lower = cuisine?.toLowerCase() as CuisineType
    if (validCuisines.includes(lower)) {
      return lower
    }
    
    return preferredCuisines[0] || 'fusion'
  }
}

export const recipeService = new RecipeService(OPENAI_API_KEY)
export default recipeService

