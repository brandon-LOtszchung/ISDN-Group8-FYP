import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import DropdownButton from '@/components/ui/DropdownButton'
import Input from '@/components/ui/Input'
import { ChefHat, Plus, Minus } from 'lucide-react'
import { LOCALIZED_STRINGS } from '@/constants'
import { InterfaceLanguage } from '@/types'

const schema = z.object({
  familyName: z.string().min(1, '請輸入家庭稱呼'),
})

type FormData = z.infer<typeof schema>

interface FamilySetupProps {
  onNext: (name: string, memberCount: number) => void
}

export default function FamilySetup({ onNext }: FamilySetupProps) {
  const { state } = useApp()

  const [displayLanguage, setDisplayLanguage] = useState<InterfaceLanguage>(
    state.preferredLanguage
  )
  const [memberCount, setMemberCount] = useState(3)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    onNext(data.familyName, memberCount)
  }

  const adjustMemberCount = (delta: number) => {
    setMemberCount((prev) => Math.max(1, Math.min(8, prev + delta)))
  }

  const handleLanguageChange = (item: string) => {
    const selectedLocale =
      item === 'Chinese' ? 'zh-HK' : item === 'Filipino' ? 'fil' : 'en'
    state.preferredLanguage = selectedLocale
    setDisplayLanguage(selectedLocale)
  }

  return (
    <div className="floating-card animate-slide-up">
      <DropdownButton
        variant="ghost"
        className="mx-auto mb-8 text-4xl"
        items={['English', 'Chinese', 'Filipino']}
        onSelect={(item) => handleLanguageChange(item)}
      >
        🌐
      </DropdownButton>

      <div className="text-center mb-8">
        <div className="mx-auto mb-8 text-6xl animate-bounce-subtle">🍳</div>
        <h1
          className={`text-4xl font-bold gradient-text mb-3 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} leading-tight`}
        >
          {LOCALIZED_STRINGS[displayLanguage || 'en']['onboarding_tagline'] ??
            LOCALIZED_STRINGS['en']['onboarding_tagline']}
        </h1>
        <h2
          className={`text-2xl font-medium text-primary-600 mb-4 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
        >
          {LOCALIZED_STRINGS[displayLanguage || 'en']['onboarding_happy'] ??
            LOCALIZED_STRINGS['en']['onboarding_happy']}
        </h2>
        <p
          className={`text-warm-600 text-lg ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} leading-relaxed`}
        >
          {LOCALIZED_STRINGS[displayLanguage || 'en']['onboarding_help'] ??
            LOCALIZED_STRINGS['en']['onboarding_help']}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label={
            LOCALIZED_STRINGS[displayLanguage || 'en'][
              'onboarding_familyName'
            ] ?? LOCALIZED_STRINGS['en']['onboarding_familyName']
          }
          placeholder={
            LOCALIZED_STRINGS[displayLanguage || 'en'][
              'onboarding_familyNameExample'
            ] ?? LOCALIZED_STRINGS['en']['onboarding_familyNameExample']
          }
          {...register('familyName')}
          error={errors.familyName?.message}
          className={displayLanguage === 'zh-HK' ? 'font-chinese' : ''}
        />

        <div>
          <label
            className={`block text-sm font-semibold text-warm-700 mb-4 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
          >
            {LOCALIZED_STRINGS[displayLanguage || 'en'][
              'onboarding_familyNumber'
            ] ?? LOCALIZED_STRINGS['en']['onboarding_familyNumber']}
          </label>
          <div className="flex items-center justify-center space-x-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustMemberCount(-1)}
              disabled={memberCount <= 1}
              className="w-12 h-12 rounded-full p-0 hover:bg-primary-50"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <div className="w-24 h-20 bg-gradient-to-br from-primary-100 to-orange-100 rounded-3xl flex items-center justify-center shadow-lg border border-primary-200/50 animate-gentle-pulse">
              <span
                className={`text-3xl font-bold text-primary-700 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
              >
                {memberCount}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustMemberCount(1)}
              disabled={memberCount >= 8}
              className="w-12 h-12 rounded-full p-0 hover:bg-primary-50"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <p
            className={`text-sm text-warm-500 text-center mt-4 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''}`}
          >
            {LOCALIZED_STRINGS[displayLanguage || 'en']['onboarding_include'] ??
              LOCALIZED_STRINGS['en']['onboarding_include']}
          </p>
        </div>

        <Button
          type="submit"
          className={`w-full mt-8 ${displayLanguage === 'zh-HK' ? 'font-chinese' : ''} text-lg py-5`}
        >
          {LOCALIZED_STRINGS[displayLanguage || 'en'][
            'onboarding_startSetting'
          ] ?? LOCALIZED_STRINGS['en']['onboarding_startSetting']}{' '}
          ✨
        </Button>
      </form>
    </div>
  )
}
