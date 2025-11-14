import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Button from '@/components/ui/Button'
import { Family } from '@/types'
import { ArrowLeft } from 'lucide-react'

interface FamilyPreferencesProps {
  preferences: Family['preferences']
  onNext: (preferences: Family['preferences']) => void
  onBack: () => void
}

export default function FamilyPreferences({
  preferences,
  onNext,
  onBack,
}: FamilyPreferencesProps) {
  const { language, t } = useLanguage()
  const [cookingSkill, setCookingSkill] = useState(preferences.cookingSkillLevel)
  const [budget, setBudget] = useState(preferences.budgetRange)
  const [mealTimes] = useState(preferences.mealTimes)

  const skillOptions = [
    { value: 'beginner' as const },
    { value: 'intermediate' as const },
    { value: 'advanced' as const },
  ]

  const budgetOptions = [
    { value: 'low' as const },
    { value: 'medium' as const },
    { value: 'high' as const },
  ]

  const onSubmit = () => {
    const updatedPreferences: Family['preferences'] = {
      cookingSkillLevel: cookingSkill,
      budgetRange: budget,
      mealTimes: mealTimes,
      preferredLanguage: language,
    }
    onNext(updatedPreferences)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-md mx-auto">
        {/* Top Navigation */}
        <div className="bg-white border-b border-warm-200 px-4 py-3 flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-warm-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-warm-600" strokeWidth={2} />
          </button>
          <div className="flex-1 text-center pr-8">
            <h1 className="font-semibold text-warm-900" style={{ fontSize: '16px' }}>Preferences</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 border border-warm-100">
            <div className="space-y-5">
              {/* Cooking Skill - Horizontal Scroll */}
              <div>
                <label className="font-bold text-warm-700 mb-2 block" style={{ fontSize: '14px' }}>Cooking Skill</label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                  {skillOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCookingSkill(option.value)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-lg transition-all ${
                        cookingSkill === option.value
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'bg-warm-50 border border-warm-200 text-warm-700'
                      }`}
                      style={{ fontSize: '14px', minWidth: '100px' }}
                    >
                      {t(option.value)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget - Horizontal Scroll */}
              <div>
                <label className="font-bold text-warm-700 mb-2 block" style={{ fontSize: '14px' }}>Budget</label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBudget(option.value)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-lg transition-all ${
                        budget === option.value
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'bg-warm-50 border border-warm-200 text-warm-700'
                      }`}
                      style={{ fontSize: '14px', minWidth: '100px' }}
                    >
                      {t(option.value)}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={onSubmit} className="w-full">
                {t('complete')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
