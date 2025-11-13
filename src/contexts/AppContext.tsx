import { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, Family, InventoryItem, Recipe, RecipeIngredient } from '@/types'
import { STORAGE_KEYS } from '@/constants'

interface AppContextType {
  state: AppState
  setFamily: (family: Family) => void
  setInventory: (inventory: InventoryItem[]) => void
  setRecipes: (recipes: Recipe[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  completeOnboarding: () => void
  initializeFridge: () => void
  clearError: () => void
  addToShoppingList: (items: RecipeIngredient[]) => void
  removeFromShoppingList: (item: Pick<RecipeIngredient, 'name' | 'unit'>) => void
  clearShoppingList: () => void
}

type AppAction =
  | { type: 'SET_FAMILY'; payload: Family }
  | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'INITIALIZE_FRIDGE' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TO_SHOPPING_LIST'; payload: RecipeIngredient[] }
  | {
      type: 'REMOVE_FROM_SHOPPING_LIST'
      payload: Pick<RecipeIngredient, 'name' | 'unit'>
    }
  | { type: 'CLEAR_SHOPPING_LIST' }

const initialState: AppState = {
  preferredLanguage: 'en',
  family: null,
  inventory: [],
  currentRecipes: [],
  shoppingList: JSON.parse(
    localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST) || '[]'
  ),
  isLoading: false,
  error: null,
  onboardingCompleted:
    localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true',
  fridgeInitialized:
    localStorage.getItem(STORAGE_KEYS.FRIDGE_INITIALIZED) === 'true',
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FAMILY':
      localStorage.setItem(
        STORAGE_KEYS.FAMILY_DATA,
        JSON.stringify(action.payload)
      )
      return { ...state, family: action.payload }

    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload }

    case 'SET_RECIPES':
      return { ...state, currentRecipes: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'COMPLETE_ONBOARDING':
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true')
      return { ...state, onboardingCompleted: true }

    case 'INITIALIZE_FRIDGE':
      localStorage.setItem(STORAGE_KEYS.FRIDGE_INITIALIZED, 'true')
      return { ...state, fridgeInitialized: true }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'ADD_TO_SHOPPING_LIST': {
      const updatedList = [...state.shoppingList]

      action.payload.forEach((item) => {
        const existingIndex = updatedList.findIndex(
          (existing) =>
            existing.name.toLowerCase() === item.name.toLowerCase() &&
            existing.unit.toLowerCase() === item.unit.toLowerCase()
        )

        if (existingIndex >= 0) {
          const existingItem = updatedList[existingIndex]
          updatedList[existingIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
            alternatives: item.alternatives || existingItem.alternatives,
          }
        } else {
          updatedList.push({ ...item })
        }
      })

      localStorage.setItem(
        STORAGE_KEYS.SHOPPING_LIST,
        JSON.stringify(updatedList)
      )

      return { ...state, shoppingList: updatedList }
    }

    case 'REMOVE_FROM_SHOPPING_LIST': {
      const updatedList = state.shoppingList.filter(
        (item) =>
          !(
            item.name.toLowerCase() === action.payload.name.toLowerCase() &&
            item.unit.toLowerCase() === action.payload.unit.toLowerCase()
          )
      )

      localStorage.setItem(
        STORAGE_KEYS.SHOPPING_LIST,
        JSON.stringify(updatedList)
      )

      return { ...state, shoppingList: updatedList }
    }

    case 'CLEAR_SHOPPING_LIST': {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify([]))
      return { ...state, shoppingList: [] }
    }

    default:
      return state
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setFamily = (family: Family) => {
    dispatch({ type: 'SET_FAMILY', payload: family })
  }

  const setInventory = (inventory: InventoryItem[]) => {
    dispatch({ type: 'SET_INVENTORY', payload: inventory })
  }

  const setRecipes = (recipes: Recipe[]) => {
    dispatch({ type: 'SET_RECIPES', payload: recipes })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const completeOnboarding = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' })
  }

  const initializeFridge = () => {
    dispatch({ type: 'INITIALIZE_FRIDGE' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const addToShoppingList = (items: RecipeIngredient[]) => {
    if (!items || items.length === 0) return
    dispatch({ type: 'ADD_TO_SHOPPING_LIST', payload: items })
  }

  const removeFromShoppingList = (
    item: Pick<RecipeIngredient, 'name' | 'unit'>
  ) => {
    dispatch({ type: 'REMOVE_FROM_SHOPPING_LIST', payload: item })
  }

  const clearShoppingList = () => {
    dispatch({ type: 'CLEAR_SHOPPING_LIST' })
  }

  const value: AppContextType = {
    state,
    setFamily,
    setInventory,
    setRecipes,
    setLoading,
    setError,
    completeOnboarding,
    initializeFridge,
    clearError,
    addToShoppingList,
    removeFromShoppingList,
    clearShoppingList,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
