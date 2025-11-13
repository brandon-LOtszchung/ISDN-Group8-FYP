import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import OnboardingFlow from '@/pages/onboarding/OnboardingFlow'
import FridgeInitialization from '@/pages/onboarding/FridgeInitialization'
import Dashboard from '@/pages/dashboard/Dashboard'
import RecipeGeneration from '@/pages/recipes/RecipeGeneration'
import RecipeDetail from '@/pages/recipes/RecipeDetail'
import ShoppingList from '@/pages/shopping/ShoppingList'

function App() {
  const { state } = useApp()
  const location = useLocation()

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recipes" element={<RecipeGeneration />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/shopping-list" element={<ShoppingList />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
