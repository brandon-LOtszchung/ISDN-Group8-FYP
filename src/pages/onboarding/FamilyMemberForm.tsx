import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLanguage } from '@/contexts/LanguageContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FamilyMember, DietaryRestriction, Allergy } from '@/types'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Please enter name'),
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
  const { t } = useLanguage()
  const [age, setAge] = useState(member?.age || 25)
  const [selectedDietary, setSelectedDietary] = useState<DietaryRestriction[]>([])
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: member?.name || '',
    },
  })

  const dietaryOptions: { value: DietaryRestriction }[] = [
    { value: 'vegetarian' },
    { value: 'vegan' },
    { value: 'low-sodium' },
    { value: 'low-sugar' },
    { value: 'low-fat' },
    { value: 'keto' },
    { value: 'halal' },
    { value: 'kosher' },
  ]

  const allergyOptions: { value: Allergy }[] = [
    { value: 'nuts' },
    { value: 'peanuts' },
    { value: 'dairyAllergy' },
    { value: 'eggs' },
    { value: 'shellfish' },
    { value: 'fish' },
    { value: 'soy' },
    { value: 'wheat' },
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
  }, [member?.name, member?.age, member?.dietaryRestrictions, member?.allergies, memberIndex, reset])

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
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-md mx-auto">
        {/* Top Navigation */}
        <div className="bg-white border-b border-warm-200 px-4 py-3 flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-warm-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-warm-600" strokeWidth={2} />
          </button>
          <div className="flex-1 text-center pr-8">
            <h1 className="font-semibold text-warm-900" style={{ fontSize: '16px' }}>
              {t('member')} {memberIndex + 1} / {totalMembers}
            </h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 border border-warm-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label={t('memberName')}
                placeholder={t('memberNamePlaceholder')}
                {...register('name')}
                error={errors.name?.message}
              />

              {/* Age Slider */}
              <div>
                <label className="block font-bold text-warm-700 mb-3" style={{ fontSize: '15px' }}>
                  {t('age')}: <span className="text-primary-600">{age}</span> {t('yearsOld')}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full slider"
                />
              </div>

              {/* Dietary - Horizontal Scroll */}
              <div>
                <label className="block font-bold text-warm-700 mb-2" style={{ fontSize: '14px' }}>
                  {t('dietary')} <span className="text-warm-400 font-normal" style={{ fontSize: '12px' }}>{t('optional')}</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleDietary(option.value)}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all ${
                        selectedDietary.includes(option.value)
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'bg-warm-50 border border-warm-200 text-warm-700'
                      }`}
                      style={{ fontSize: '13px', minWidth: '80px' }}
                    >
                      {t(option.value)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies - Horizontal Scroll */}
              <div>
                <label className="block font-bold text-warm-700 mb-2" style={{ fontSize: '14px' }}>
                  {t('allergies')} <span className="text-warm-400 font-normal" style={{ fontSize: '12px' }}>{t('optional')}</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                  {allergyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleAllergy(option.value)}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all ${
                        selectedAllergies.includes(option.value)
                          ? 'bg-coral-500 text-white font-semibold'
                          : 'bg-warm-50 border border-warm-200 text-warm-700'
                      }`}
                      style={{ fontSize: '13px', minWidth: '80px' }}
                    >
                      {t(option.value)}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {memberIndex < totalMembers - 1 ? t('next') : t('complete')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
