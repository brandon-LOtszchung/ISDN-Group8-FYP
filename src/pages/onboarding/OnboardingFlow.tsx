import { useState } from 'react'
import FamilySetup from './FamilySetup'
import FamilyMemberForm from './FamilyMemberForm'
import FamilyPreferences from './FamilyPreferences'
import OnboardingComplete from './OnboardingComplete'
import { Family, FamilyMember } from '@/types'
import { useApp } from '@/contexts/AppContext'
import { mockDataService } from '@/services/mockData'

type OnboardingStep = 'family-setup' | 'member-details' | 'preferences' | 'complete'

export default function OnboardingFlow() {
  const { setFamily, setLoading, setError, completeOnboarding } = useApp()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('family-setup')
  const [familyData, setFamilyData] = useState<Partial<Family>>({
    name: '',
    members: [],
    preferences: {
      cookingSkillLevel: 'intermediate',
      budgetRange: 'medium',
      mealTimes: {
        breakfast: '08:00',
        lunch: '12:30',
        dinner: '19:00',
      },
      preferredLanguage: 'en',
    },
  })
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0)

  const handleFamilySetup = (name: string, memberCount: number) => {
    const members: Partial<FamilyMember>[] = Array.from({ length: memberCount }, (_, i) => ({
      id: `member-${i + 1}`,
      name: '',
      age: 0,
      dietaryRestrictions: [],
      allergies: [],
      healthConditions: [],
      preferences: {
        spiceLevel: 'mild',
        favoriteCuisines: [],
        dislikedIngredients: [],
      },
    }))

    setFamilyData(prev => ({
      ...prev,
      name,
      members: members as FamilyMember[],
    }))
    setCurrentStep('member-details')
  }

  const handleMemberUpdate = (member: FamilyMember) => {
    setFamilyData(prev => ({
      ...prev,
      members: prev.members?.map((m, i) => 
        i === currentMemberIndex ? member : m
      ) || [],
    }))

    if (currentMemberIndex < (familyData.members?.length || 0) - 1) {
      setCurrentMemberIndex(prev => prev + 1)
    } else {
      setCurrentStep('preferences')
    }
  }

  const handlePreferencesUpdate = (preferences: Family['preferences']) => {
    setFamilyData(prev => ({
      ...prev,
      preferences,
    }))
    setCurrentStep('complete')
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      const newFamily = await mockDataService.createFamily(familyData as Omit<Family, 'id' | 'createdAt' | 'updatedAt'>)
      setFamily(newFamily)
      completeOnboarding()
    } catch (error) {
      setError('Failed to save family information')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'family-setup':
        return <FamilySetup onNext={handleFamilySetup} />
      
      case 'member-details':
        const currentMember = familyData.members?.[currentMemberIndex]
        return (
          <FamilyMemberForm
            member={currentMember}
            memberIndex={currentMemberIndex}
            totalMembers={familyData.members?.length || 0}
            onNext={handleMemberUpdate}
            onBack={() => {
              if (currentMemberIndex > 0) {
                setCurrentMemberIndex(prev => prev - 1)
              } else {
                setCurrentStep('family-setup')
              }
            }}
          />
        )
      
      case 'preferences':
        return (
          <FamilyPreferences
            preferences={familyData.preferences!}
            onNext={handlePreferencesUpdate}
            onBack={() => setCurrentStep('member-details')}
          />
        )
      
      case 'complete':
        return (
          <OnboardingComplete
            family={familyData as Family}
            onComplete={handleComplete}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {renderStep()}
      </div>
    </div>
  )
}
