import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Family, InventoryItem } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { getFamily, getInventory, supabase } from '@/services/supabase'

interface AppState {
  family: Family | null
  inventory: InventoryItem[]
  isLoading: boolean
  error: string | null
  onboardingCompleted: boolean
  fridgeInitialized: boolean
}

interface AppContextType {
  state: AppState
  setFamily: (family: Family) => void
  setInventory: (inventory: InventoryItem[]) => void
  addInventoryItem: (item: InventoryItem) => void
  removeInventoryItem: (itemId: string) => void
  updateInventoryItem: (itemId: string, quantity: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  completeOnboarding: () => void
  initializeFridge: () => void
  clearError: () => void
}

type AppAction =
  | { type: 'SET_FAMILY'; payload: Family }
  | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'REMOVE_INVENTORY_ITEM'; payload: string }
  | { type: 'UPDATE_INVENTORY_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'INITIALIZE_FRIDGE' }
  | { type: 'CLEAR_ERROR' }

const initialState: AppState = {
  family: null,
  inventory: JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]'),
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

    case 'SET_INVENTORY': {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(action.payload))
      return { ...state, inventory: action.payload }
    }

    case 'ADD_INVENTORY_ITEM': {
      const updated = [...state.inventory, action.payload]
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated))
      return { ...state, inventory: updated }
    }

    case 'REMOVE_INVENTORY_ITEM': {
      const updated = state.inventory.filter(item => item.id !== action.payload)
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated))
      return { ...state, inventory: updated }
    }

    case 'UPDATE_INVENTORY_ITEM': {
      const updated = state.inventory.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated))
      return { ...state, inventory: updated }
    }

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

  // Load family and inventory from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const family = await getFamily()
      if (family) {
        dispatch({ type: 'SET_FAMILY', payload: family })
      }
      
      const inventory = await getInventory()
      if (inventory.length > 0) {
        dispatch({ type: 'SET_INVENTORY', payload: inventory })
      }
    }
    loadData()
  }, [])

  // Set up Supabase realtime subscription for inventory updates
  useEffect(() => {
    const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'
    
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `family_id=eq.${DEFAULT_FAMILY_ID}`,
        },
        async () => {
          // Reload inventory when changes occur
          const inventory = await getInventory()
          dispatch({ type: 'SET_INVENTORY', payload: inventory })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const setFamily = (family: Family) => {
    dispatch({ type: 'SET_FAMILY', payload: family })
  }

  const setInventory = (inventory: InventoryItem[]) => {
    dispatch({ type: 'SET_INVENTORY', payload: inventory })
  }

  const addInventoryItem = async (item: InventoryItem) => {
    try {
      const { addInventoryItem: addToSupabase } = await import('@/services/supabase')
      const newItem = await addToSupabase(item)
      dispatch({ type: 'ADD_INVENTORY_ITEM', payload: newItem })
    } catch (error) {
      // Fallback to local storage
      dispatch({ type: 'ADD_INVENTORY_ITEM', payload: item })
    }
  }

  const removeInventoryItem = async (itemId: string) => {
    try {
      const { deleteInventoryItem: deleteFromSupabase } = await import('@/services/supabase')
      await deleteFromSupabase(itemId)
      dispatch({ type: 'REMOVE_INVENTORY_ITEM', payload: itemId })
    } catch (error) {
      // Fallback to local storage
      dispatch({ type: 'REMOVE_INVENTORY_ITEM', payload: itemId })
    }
  }

  const updateInventoryItem = async (itemId: string, quantity: number) => {
    try {
      const { updateInventoryItem: updateInSupabase } = await import('@/services/supabase')
      await updateInSupabase(itemId, quantity)
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { id: itemId, quantity } })
    } catch (error) {
      // Fallback to local storage
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { id: itemId, quantity } })
    }
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

  return (
    <AppContext.Provider
      value={{
        state,
        setFamily,
        setInventory,
        addInventoryItem,
        removeInventoryItem,
        updateInventoryItem,
        setLoading,
        setError,
        completeOnboarding,
        initializeFridge,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
