import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FamilyMember, DietaryRestriction, Allergy } from '@/types'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, '請輸入姓名'),
})

type FormData = z.infer<typeof schema>

interface FamilyMemberFormProps {
  member?: Partial<FamilyMember>
  memberIndex: number
  totalMembers: number
  onNext: (member: FamilyMember) => void
  onBack: () => void
}

export default function FamilyMemberForm({ 
  member, 
  memberIndex, 
  totalMembers, 
  onNext, 
  onBack 
}: FamilyMemberFormProps) {
  const [age, setAge] = useState(member?.age || 25)
  const [selectedDietary, setSelectedDietary] = useState<DietaryRestriction[]>([])
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([])
  const [customDietary, setCustomDietary] = useState('')
  const [customAllergy, setCustomAllergy] = useState('')
  const [showCustomDietary, setShowCustomDietary] = useState(false)
  const [showCustomAllergy, setShowCustomAllergy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: member?.name || '',
    },
  })

  // All dietary options with emojis
  const dietaryOptions = [
    { value: 'vegetarian' as DietaryRestriction, label: '素食', icon: '🥬' },
    { value: 'vegan' as DietaryRestriction, label: '純素', icon: '🌱' },
    { value: 'low-sodium' as DietaryRestriction, label: '低鹽', icon: '🧂' },
    { value: 'low-sugar' as DietaryRestriction, label: '低糖', icon: '🍯' },
    { value: 'low-fat' as DietaryRestriction, label: '低脂', icon: '🥗' },
    { value: 'keto' as DietaryRestriction, label: '生酮', icon: '🥑' },
    { value: 'halal' as DietaryRestriction, label: '清真', icon: '🕌' },
  ]

  // All allergy options with emojis
  const allergyOptions = [
    { value: 'nuts' as Allergy, label: '果仁', icon: '🥜' },
    { value: 'peanuts' as Allergy, label: '花生', icon: '🥜' },
    { value: 'dairy' as Allergy, label: '奶類', icon: '🥛' },
    { value: 'eggs' as Allergy, label: '雞蛋', icon: '🥚' },
    { value: 'shellfish' as Allergy, label: '貝類', icon: '🦐' },
    { value: 'fish' as Allergy, label: '魚類', icon: '🐟' },
    { value: 'soy' as Allergy, label: '豆類', icon: '🫘' },
    { value: 'wheat' as Allergy, label: '小麥', icon: '🌾' },
  ]

  const onSubmit = (data: FormData) => {
    const updatedMember: FamilyMember = {
      id: member?.id || `member-${memberIndex + 1}`,
      name: data.name,
      age: age,
      dietaryRestrictions: selectedDietary,
      allergies: selectedAllergies,
      healthConditions: [],
      preferences: {
        spiceLevel: 'mild',
        favoriteCuisines: [],
        dislikedIngredients: [],
      },
    }
    onNext(updatedMember)
  }

  const toggleDietary = (value: DietaryRestriction) => {
    setSelectedDietary(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    )
  }

  const toggleAllergy = (value: Allergy) => {
    setSelectedAllergies(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Phone-style Header */}
        <div className="flex items-center mb-6 pt-2">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm text-warm-500 font-chinese">
              {memberIndex + 1}/{totalMembers}
            </span>
          </div>
          <div className="w-9"></div>
        </div>

        <div className="floating-card">
          {/* Simple Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold gradient-text font-chinese whitespace-nowrap">
              第{memberIndex + 1}位成員
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <Input
              label="姓名"
              placeholder="例如：阿明、媽媽"
              {...register('name')}
              error={errors.name?.message}
              className="font-chinese"
            />

            {/* Age Slider - Compact */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                年齡：{age}歲
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-primary-200 to-primary-300 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            {/* Dietary - Compact Grid */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                飲食習慣<span className="text-warm-400">（可選）</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDietary(option.value)}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      selectedDietary.includes(option.value)
                        ? 'border-primary-400 bg-primary-50 shadow-md'
                        : 'border-warm-200 bg-white/60 hover:border-warm-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="text-xs font-medium text-warm-800 font-chinese whitespace-nowrap">{option.label}</div>
                  </button>
                ))}
                {/* Others Option */}
                <button
                  type="button"
                  onClick={() => setShowCustomDietary(!showCustomDietary)}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    showCustomDietary || customDietary
                      ? 'border-primary-400 bg-primary-50 shadow-md'
                      : 'border-warm-200 bg-white/60 hover:border-warm-300'
                  }`}
                >
                  <div className="text-lg mb-1">✏️</div>
                  <div className="text-xs font-medium text-warm-800 font-chinese">其他</div>
                </button>
              </div>
              {showCustomDietary && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="請輸入其他飲食習慣"
                    value={customDietary}
                    onChange={(e) => setCustomDietary(e.target.value)}
                    className="input-field text-sm font-chinese"
                  />
                </div>
              )}
            </div>

            {/* Allergies - Compact Grid */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-3 font-chinese whitespace-nowrap">
                食物敏感<span className="text-warm-400">（可選）</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {allergyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleAllergy(option.value)}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      selectedAllergies.includes(option.value)
                        ? 'border-coral-400 bg-coral-50 shadow-md'
                        : 'border-warm-200 bg-white/60 hover:border-warm-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="text-xs font-medium text-warm-800 font-chinese whitespace-nowrap">{option.label}</div>
                  </button>
                ))}
                {/* Others Option */}
                <button
                  type="button"
                  onClick={() => setShowCustomAllergy(!showCustomAllergy)}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    showCustomAllergy || customAllergy
                      ? 'border-coral-400 bg-coral-50 shadow-md'
                      : 'border-warm-200 bg-white/60 hover:border-warm-300'
                  }`}
                >
                  <div className="text-lg mb-1">✏️</div>
                  <div className="text-xs font-medium text-warm-800 font-chinese">其他</div>
                </button>
              </div>
              {showCustomAllergy && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="請輸入其他食物敏感"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className="input-field text-sm font-chinese"
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full font-chinese whitespace-nowrap">
              {memberIndex < totalMembers - 1 ? '下一位→' : '完成✨'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
