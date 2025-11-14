import { InventoryItem, ItemCategory } from '@/types'
import { generateId } from '@/utils'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface DetectedItem {
  name: string
  category: ItemCategory
  quantity: number
  unit: string
  confidence: number
}

/**
 * Vision Service - Analyzes fridge photos using OpenAI Vision API
 */
export class VisionService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Analyze a single fridge photo
   */
  async analyzePhoto(imageBase64: string): Promise<DetectedItem[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `You are a smart fridge AI assistant. Analyze this fridge photo and identify ALL food items you can see.

For each item, provide:
- name: Item name in English
- category: One of: vegetables, fruits, meat, seafood, dairy, grains, condiments, beverages, snacks, frozen, canned, other
- quantity: Estimated quantity (be reasonable)
- unit: Appropriate unit (pieces, g, kg, ml, l, bottle, head, bulb, etc.)
- confidence: Your confidence level (0.0 to 1.0)

Return ONLY a JSON array of items, no other text:
[
  {
    "name": "Chicken Breast",
    "category": "meat",
    "quantity": 2,
    "unit": "pieces",
    "confidence": 0.95
  }
]

Be specific with names (e.g., "Chicken Breast" not just "Chicken").
Estimate quantities conservatively.
Only include items you can clearly see.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4 with vision
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high', // High detail for better item detection
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent results
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data: OpenAIVisionResponse = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      return this.parseVisionResponse(content)
    } catch (error) {
      console.error('Vision API error:', error)
      throw error
    }
  }

  /**
   * Analyze multiple photos and merge results
   */
  async analyzeMultiplePhotos(imagesBase64: string[]): Promise<InventoryItem[]> {
    const allDetectedItems: DetectedItem[] = []

    // Analyze each photo
    for (let i = 0; i < imagesBase64.length; i++) {
      try {
        const items = await this.analyzePhoto(imagesBase64[i])
        allDetectedItems.push(...items)
      } catch (error) {
        console.error(`Failed to analyze photo ${i + 1}:`, error)
      }
    }

    // Merge duplicate items (same name and unit)
    return this.mergeDetectedItems(allDetectedItems)
  }

  /**
   * Parse AI response into structured items
   */
  private parseVisionResponse(content: string): DetectedItem[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      
      const items = Array.isArray(parsed) ? parsed : []
      
      return items.map((item: any) => ({
        name: item.name || 'Unknown Item',
        category: this.validateCategory(item.category),
        quantity: Math.max(0, Number(item.quantity) || 1),
        unit: item.unit || 'pieces',
        confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
      }))
    } catch (error) {
      console.error('Failed to parse vision response:', error)
      return []
    }
  }

  /**
   * Merge duplicate items from multiple photos
   */
  private mergeDetectedItems(items: DetectedItem[]): InventoryItem[] {
    const mergedMap = new Map<string, DetectedItem>()

    items.forEach((item) => {
      const key = `${item.name.toLowerCase()}-${item.unit.toLowerCase()}`
      const existing = mergedMap.get(key)

      if (existing) {
        // Merge: take higher quantity and average confidence
        existing.quantity = Math.max(existing.quantity, item.quantity)
        existing.confidence = (existing.confidence + item.confidence) / 2
      } else {
        mergedMap.set(key, { ...item })
      }
    })

    // Convert to InventoryItem format
    return Array.from(mergedMap.values()).map((item) => ({
      id: generateId(),
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      confidence: item.confidence,
      addedAt: new Date().toISOString(),
    }))
  }

  /**
   * Validate category
   */
  private validateCategory(category: string): ItemCategory {
    const validCategories: ItemCategory[] = [
      'vegetables', 'fruits', 'meat', 'seafood', 'dairy', 
      'grains', 'condiments', 'beverages', 'snacks', 
      'frozen', 'canned', 'other'
    ]
    
    return validCategories.includes(category as ItemCategory) 
      ? (category as ItemCategory) 
      : 'other'
  }
}

export const visionService = new VisionService(OPENAI_API_KEY)
export default visionService

