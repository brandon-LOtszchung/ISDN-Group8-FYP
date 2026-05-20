import { InventoryItem, ItemCategory } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://159.223.45.101:8000'

interface DetectedItem {
  name: string
  quantity: number
  category: string
}

interface InitializeResponse {
  success: boolean
  detected_items: DetectedItem[]
  processing_time: number
  warning: string | null
  error: string | null
}

function validateCategory(category: string): ItemCategory {
  const validCategories: ItemCategory[] = [
    'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
    'grains', 'condiments', 'beverages', 'snacks',
    'frozen', 'canned', 'other'
  ]
  return validCategories.includes(category as ItemCategory)
    ? (category as ItemCategory)
    : 'other'
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function mapToInventoryItem(item: DetectedItem): InventoryItem {
  return {
    id: generateId(),
    name: item.name,
    category: validateCategory(item.category),
    quantity: item.quantity,
  }
}

export async function initializeInventory(images: File[]): Promise<InventoryItem[]> {
  const formData = new FormData()
  images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await fetch(`${API_BASE_URL}/api/inventory/initialize`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to initialize inventory')
  }

  const data: InitializeResponse = await response.json()

  if (!data.success) {
    throw new Error(data.warning || data.error || 'Failed to detect items')
  }

  return data.detected_items.map(mapToInventoryItem)
}

