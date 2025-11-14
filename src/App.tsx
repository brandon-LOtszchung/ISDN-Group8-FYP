import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { dataService } from '@/services/dataService'
import OnboardingFlow from '@/pages/onboarding/OnboardingFlow'
import FridgeInitialization from '@/pages/onboarding/FridgeInitialization'
import Dashboard from '@/pages/dashboard/Dashboard'
import RecipeGeneration from '@/pages/recipes/RecipeGeneration'
import RecipeDetail from '@/pages/recipes/RecipeDetail'
import ShoppingList from '@/pages/shopping/ShoppingList'

function App() {
  const { state, setFamily } = useApp()
  const location = useLocation()

  // Load default family on app start
  useEffect(() => {
    const loadDefaultFamily = async () => {
      try {
        const family = await dataService.getFamily()
        if (family) {
          setFamily(family)
        }
      } catch (error) {
        console.error('Failed to load default family:', error)
      }
    }

    if (!state.family) {
      loadDefaultFamily()
    }
  }, [])

  if (location.pathname.startsWith('/onboarding')) {
    return <OnboardingFlow />
  }

  if (!state.onboardingCompleted) {
    return <OnboardingFlow />
  }

  if (!state.fridgeInitialized) {
    return <FridgeInitialization />
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/recipes" element={<RecipeGeneration />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/shopping-list" element={<ShoppingList />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
