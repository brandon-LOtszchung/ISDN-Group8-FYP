import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import OnboardingFlow from '@/pages/OnboardingFlow'
import InventoryPage from '@/pages/InventoryPage'

function App() {
  const { state } = useApp()

  // If onboarding not completed, show onboarding
  if (!state.onboardingCompleted) {
    return <OnboardingFlow />
  }

  // Otherwise show main app
  return (
    <Routes>
      <Route path="/" element={<InventoryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
