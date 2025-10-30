import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import OnboardingFlow from '@/pages/onboarding/OnboardingFlow'
import FridgeInitialization from '@/pages/onboarding/FridgeInitialization'
import Dashboard from '@/pages/dashboard/Dashboard'
import RecipeGeneration from '@/pages/recipes/RecipeGeneration'
import RecipeDetail from '@/pages/recipes/RecipeDetail'

function App() {
  const { state } = useApp()

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
