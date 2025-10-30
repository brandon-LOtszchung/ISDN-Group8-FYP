import { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, Family, InventoryItem, Recipe } from '@/types'
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

const initialState: AppState = {
  family: null,
  inventory: [],
  currentRecipes: [],
  isLoading: false,
  error: null,
  onboardingCompleted: localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true',
  fridgeInitialized: localStorage.getItem(STORAGE_KEYS.FRIDGE_INITIALIZED) === 'true',
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FAMILY':
      localStorage.setItem(STORAGE_KEYS.FAMILY_DATA, JSON.stringify(action.payload))
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
