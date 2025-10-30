import axios from 'axios'
import { ApiResponse, Family, InventoryItem, Recipe, RecipeRequest } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const familyApi = {
  create: async (family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<Family> => {
    const response = await api.post<ApiResponse<Family>>('/api/family', family)
    return response.data.data
  },

  get: async (id: string): Promise<Family> => {
    const response = await api.get<ApiResponse<Family>>(`/api/family/${id}`)
    return response.data.data
  },

  update: async (id: string, family: Partial<Family>): Promise<Family> => {
    const response = await api.put<ApiResponse<Family>>(`/api/family/${id}`, family)
    return response.data.data
  },
}

export const inventoryApi = {
  getCurrent: async (): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>('/api/inventory/current')
    return response.data.data
  },

  initialize: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/api/inventory/initialize')
    return response.data.data
  },

  getHistory: async (days = 7): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(`/api/inventory/history?days=${days}`)
    return response.data.data
  },
}

export const recipeApi = {
  generate: async (request: RecipeRequest): Promise<Recipe[]> => {
    const response = await api.post<ApiResponse<Recipe[]>>('/api/recipes/generate', request)
    return response.data.data
  },

  getById: async (id: string): Promise<Recipe> => {
    const response = await api.get<ApiResponse<Recipe>>(`/api/recipes/${id}`)
    return response.data.data
  },

  getFavorites: async (): Promise<Recipe[]> => {
    const response = await api.get<ApiResponse<Recipe[]>>('/api/recipes/favorites')
    return response.data.data
  },

  addToFavorites: async (recipeId: string): Promise<void> => {
    await api.post(`/api/recipes/${recipeId}/favorite`)
  },

  removeFromFavorites: async (recipeId: string): Promise<void> => {
    await api.delete(`/api/recipes/${recipeId}/favorite`)
  },
}

export default api
