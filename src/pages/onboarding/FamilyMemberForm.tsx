import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { LOCALIZED_STRINGS } from '@/constants'
import {
  FamilyMember,
  DietaryRestriction,
  Allergy,
} from '@/types'
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
  onBack,
}: FamilyMemberFormProps) {
  const { state } = useApp()

  const displayLanguage = state.preferredLanguage
  const [age, setAge] = useState(member?.age || 25)
  const [selectedDietary, setSelectedDietary] = useState<DietaryRestriction[]>(
    []
  )
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([])
  const [customDietary, setCustomDietary] = useState('')
  const [customAllergy, setCustomAllergy] = useState('')
  const [showCustomDietary, setShowCustomDietary] = useState(false)
  const [showCustomAllergy, setShowCustomAllergy] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
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

  useEffect(() => {
    reset({ name: member?.name || '' })
    setAge(member?.age || 25)
    setSelectedDietary(member?.dietaryRestrictions || [])
    setSelectedAllergies(member?.allergies || [])
    setCustomDietary('')
    setCustomAllergy('')
    setShowCustomDietary(false)
    setShowCustomAllergy(false)
  }, [
    member?.name,
    member?.age,
    member?.dietaryRestrictions,
    member?.allergies,
    memberIndex,
    reset,
  ])

  const toggleDietary = (value: DietaryRestriction) => {
    setSelectedDietary((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  const toggleAllergy = (value: Allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
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
            <span
              className={`text-sm text-warm-500 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
            >
              {memberIndex + 1}/{totalMembers}
            </span>
          </div>
          <div className="w-9"></div>
        </div>

        <div className="floating-card">
          {/* Simple Title */}
          <div className="text-center mb-6">
            <h1
              className={`text-xl font-bold gradient-text ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
            >
              {memberIndex === 0
                ? (LOCALIZED_STRINGS[displayLanguage || 'en'][
                    'onboarding_familyMemberFirst'
                  ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberFirst'])
                : memberIndex === 1
                  ? (LOCALIZED_STRINGS[displayLanguage || 'en'][
                      'onboarding_familyMemberSecond'
                    ] ??
                    LOCALIZED_STRINGS['en']['onboarding_familyMemberSecond'])
                  : memberIndex === 2
                    ? (LOCALIZED_STRINGS[displayLanguage || 'en'][
                        'onboarding_familyMemberThird'
                      ] ??
                      LOCALIZED_STRINGS['en']['onboarding_familyMemberThird'])
                    : memberIndex === 3
                      ? (LOCALIZED_STRINGS[displayLanguage || 'en'][
                          'onboarding_familyMemberFourth'
                        ] ??
                        LOCALIZED_STRINGS['en'][
                          'onboarding_familyMemberFourth'
                        ])
                      : memberIndex === 4
                        ? (LOCALIZED_STRINGS[displayLanguage || 'en'][
                            'onboarding_familyMemberFifth'
                          ] ??
                          LOCALIZED_STRINGS['en'][
                            'onboarding_familyMemberFifth'
                          ])
                        : (LOCALIZED_STRINGS[displayLanguage || 'en'][
                            'onboarding_familyMemberSixth'
                          ] ??
                          LOCALIZED_STRINGS['en'][
                            'onboarding_familyMemberSixth'
                          ])}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <Input
              label={
                LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberName'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberName']
              }
              placeholder={
                LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberExample'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberExample']
              }
              {...register('name')}
              error={errors.name?.message}
              className={`${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
            />

            {/* Age Slider - Compact */}
            <div>
              <label
                className={`block text-sm font-medium text-warm-700 mb-3 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
              >
                {LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberAge'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberAge']}
                ：{age}
                {displayLanguage !== 'zh-HK' ? ' ' : ''}
                {LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberAgeSui'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberAgeSui']}
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
              <label
                className={`block text-sm font-medium text-warm-700 mb-3 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
              >
                {LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberHabit'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberHabit']}
                {displayLanguage !== 'zh-HK' ? ' ' : ''}
                <span className="text-warm-400">
                  {LOCALIZED_STRINGS[displayLanguage || 'en'][
                    'onboarding_familyMemberOptional'
                  ] ??
                    LOCALIZED_STRINGS['en']['onboarding_familyMemberOptional']}
                </span>
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
                    <div
                      className={`text-xs font-medium text-warm-800 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
                    >
                      {option.label}
                    </div>
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
                  <div
                    className={`text-xs font-medium text-warm-800 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
                  >
                    {LOCALIZED_STRINGS[displayLanguage || 'en'][
                      'onboarding_others'
                    ] ?? LOCALIZED_STRINGS['en']['onboarding_others']}
                  </div>
                </button>
              </div>
              {showCustomDietary && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="請輸入其他飲食習慣"
                    value={customDietary}
                    onChange={(e) => setCustomDietary(e.target.value)}
                    className={`input-field text-sm ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
                  />
                </div>
              )}
            </div>

            {/* Allergies - Compact Grid */}
            <div>
              <label
                className={`block text-sm font-medium text-warm-700 mb-3 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
              >
                {LOCALIZED_STRINGS[displayLanguage || 'en'][
                  'onboarding_familyMemberAllergy'
                ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberAllergy']}
                {displayLanguage !== 'zh-HK' ? ' ' : ''}
                <span className="text-warm-400">
                  {LOCALIZED_STRINGS[displayLanguage || 'en'][
                    'onboarding_familyMemberOptional'
                  ] ??
                    LOCALIZED_STRINGS['en']['onboarding_familyMemberOptional']}
                </span>
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
                    <div
                      className={`text-xs font-medium text-warm-800 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
                    >
                      {option.label}
                    </div>
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
                  <div
                    className={`text-xs font-medium text-warm-800 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
                  >
                    {LOCALIZED_STRINGS[displayLanguage || 'en'][
                      'onboarding_others'
                    ] ?? LOCALIZED_STRINGS['en']['onboarding_others']}
                  </div>
                </button>
              </div>
              {showCustomAllergy && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="請輸入其他食物敏感"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className={`input-field text-sm ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className={`w-full ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} whitespace-nowrap`}
            >
              {memberIndex < totalMembers - 1
                ? `${
                    LOCALIZED_STRINGS[displayLanguage || 'en'][
                      'onboarding_familyMemberNext'
                    ] ?? LOCALIZED_STRINGS['en']['onboarding_familyMemberNext']
                  }${displayLanguage !== 'zh-HK' ? ' ' : ''}→`
                : `${
                    LOCALIZED_STRINGS[displayLanguage || 'en'][
                      'OnboardingComplete'
                    ] ?? LOCALIZED_STRINGS['en']['OnboardingComplete']
                  }${displayLanguage !== 'zh-HK' ? ' ' : ''}✨`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
