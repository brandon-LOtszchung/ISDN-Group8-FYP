import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import { Family, InterfaceLanguage } from '@/types'
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
  const { state } = useApp()

  const [cookingSkill, setCookingSkill] = useState(
    preferences.cookingSkillLevel
  )

  const [displayLanguage, setDisplayLanguage] = useState<InterfaceLanguage>(
    state.preferredLanguage
  )
  const [budget, setBudget] = useState(preferences.budgetRange)
  const [mealTimes, setMealTimes] = useState(preferences.mealTimes)

  const handleLanguageChange = (item: string) => {
    const selectedLocale =
      item === 'Chinese' ? 'zh-HK' : item === 'Filipino' ? 'fil' : 'en'
    state.preferredLanguage = selectedLocale
    setDisplayLanguage(selectedLocale)
  }

  // Simplified cooking skill options with emojis
  const skillOptions = [
    { value: 'beginner', label: '新手', icon: '👶', desc: '簡單易做' },
    { value: 'intermediate', label: '一般', icon: '👩‍🍳', desc: '中等難度' },
    { value: 'advanced', label: '高手', icon: '👨‍🍳', desc: '複雜菜式' },
  ]

  // Simplified budget options with emojis
  const budgetOptions = [
    { value: 'low', label: '慳錢', icon: '💰', desc: '每餐$100以下' },
    { value: 'medium', label: '適中', icon: '💳', desc: '每餐$100-200' },
    { value: 'high', label: '豐富', icon: '💎', desc: '每餐$200以上' },
  ]

  const { handleSubmit } = useForm()

  const onSubmit = () => {
    const updatedPreferences: Family['preferences'] = {
      cookingSkillLevel: cookingSkill,
      budgetRange: budget,
      mealTimes: mealTimes,
      preferredLanguage: 'zh-HK',
    }
    onNext(updatedPreferences)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Phone-style Header */}
        <div className="flex items-center mb-6 pt-2">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </button>
          <div className="flex-1"></div>
        </div>

        <div className="floating-card">
          {/* Simple Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold gradient-text font-chinese whitespace-nowrap">
              家庭煮食偏好
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Cooking Skill - Visual Cards */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                煮食技巧
              </label>
              <div className="grid grid-cols-3 gap-3">
                {skillOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCookingSkill(option.value as any)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                      cookingSkill === option.value
                        ? 'border-primary-400 bg-primary-50 shadow-lg'
                        : 'border-warm-200 bg-white/60 hover:border-warm-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium text-warm-800 font-chinese whitespace-nowrap">
                      {option.label}
                    </div>
                    <div className="text-xs text-warm-600 font-chinese mt-1 whitespace-nowrap">
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget - Visual Cards */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                預算範圍
              </label>
              <div className="grid grid-cols-3 gap-3">
                {budgetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudget(option.value as any)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                      budget === option.value
                        ? 'border-primary-400 bg-primary-50 shadow-lg'
                        : 'border-warm-200 bg-white/60 hover:border-warm-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium text-warm-800 font-chinese whitespace-nowrap">
                      {option.label}
                    </div>
                    <div className="text-xs text-warm-600 font-chinese mt-1 whitespace-nowrap">
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Times - Simplified */}
            {/* <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                用餐時間<span className="text-warm-400">（可調整）</span>
              </label>
              <div className="bg-white/60 rounded-2xl p-4 border border-white/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg mb-2">🌅</div>
                    <label className="block text-xs text-warm-600 mb-2 font-chinese">早餐</label>
                    <input
                      type="time"
                      value={mealTimes.breakfast}
                      onChange={(e) => setMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
                      className="w-full text-center text-sm bg-white/80 border border-warm-200 rounded-lg py-2 font-chinese"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-lg mb-2">☀️</div>
                    <label className="block text-xs text-warm-600 mb-2 font-chinese">午餐</label>
                    <input
                      type="time"
                      value={mealTimes.lunch}
                      onChange={(e) => setMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
                      className="w-full text-center text-sm bg-white/80 border border-warm-200 rounded-lg py-2 font-chinese"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-lg mb-2">🌙</div>
                    <label className="block text-xs text-warm-600 mb-2 font-chinese">晚餐</label>
                    <input
                      type="time"
                      value={mealTimes.dinner}
                      onChange={(e) => setMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
                      className="w-full text-center text-sm bg-white/80 border border-warm-200 rounded-lg py-2 font-chinese"
                    />
                  </div>
                </div>
              </div>
              </div> */}

            <Button
              type="submit"
              className="w-full font-chinese text-lg py-5 whitespace-nowrap"
            >
              完成家庭設定🎉
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
