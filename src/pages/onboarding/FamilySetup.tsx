import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName } from '@/translations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Minus, Languages, Users as UsersIcon } from 'lucide-react'
import { InterfaceLanguage } from '@/types'

const schema = z.object({
  familyName: z.string().min(1, 'Please enter family name'),
})

type FormData = z.infer<typeof schema>

interface FamilySetupProps {
  onNext: (name: string, memberCount: number) => void
  initialName?: string
  initialMemberCount?: number
}

export default function FamilySetup({
  onNext,
  initialName,
  initialMemberCount,
}: FamilySetupProps) {
  const { language, setLanguage, t } = useLanguage()
  const [memberCount, setMemberCount] = useState(initialMemberCount || 3)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      familyName: initialName || '',
    },
  })

  useEffect(() => {
    reset({ familyName: initialName || '' })
    if (initialMemberCount) {
      setMemberCount(initialMemberCount)
    }
  }, [initialName, initialMemberCount, reset])

  const onSubmit = (data: FormData) => {
    onNext(data.familyName, memberCount)
  }

  const adjustMemberCount = (delta: number) => {
    setMemberCount((prev) => Math.max(1, Math.min(8, prev + delta)))
  }

  const languages: InterfaceLanguage[] = ['en', 'zh-HK', 'fil', 'id']

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* Language Selector - Top Right, Aligned */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warm-200 hover:border-warm-300 transition-all bg-white"
            >
              <Languages className="w-4 h-4 text-warm-600" strokeWidth={2} />
              <span className="text-warm-700 font-medium" style={{ fontSize: '13px' }}>
                {language.toUpperCase()}
              </span>
            </button>
            
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-warm-200 overflow-hidden z-50 min-w-[160px]">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang)
                        setShowLangMenu(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-all ${
                        language === lang
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'hover:bg-warm-50 text-warm-700'
                      }`}
                      style={{ fontSize: '14px' }}
                    >
                      {getLanguageName(lang)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-warm-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <UsersIcon className="w-8 h-8 text-primary-600" strokeWidth={2} />
            </div>
            <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '22px' }}>{t('welcome')}</h1>
            <h2 className="font-semibold text-primary-600 mb-3" style={{ fontSize: '17px' }}>{t('subtitle')}</h2>
            <p className="text-warm-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>{t('setupMessage')}</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label={t('familyName')}
              placeholder={t('familyNamePlaceholder')}
              {...register('familyName')}
              error={errors.familyName?.message}
            />

            <div>
              <label className="block font-bold text-warm-700 mb-4 text-center" style={{ fontSize: '15px' }}>
                {t('memberCount')}
              </label>
              <div className="flex items-center justify-center gap-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => adjustMemberCount(-1)}
                  disabled={memberCount <= 1}
                  className="w-11 h-11 rounded-full p-0 flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" strokeWidth={2} />
                </Button>
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center border-2 border-primary-300">
                  <span className="font-bold text-primary-700" style={{ fontSize: '32px' }}>{memberCount}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => adjustMemberCount(1)}
                  disabled={memberCount >= 8}
                  className="w-11 h-11 rounded-full p-0 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                </Button>
              </div>
              <p className="text-warm-500 text-center mt-3" style={{ fontSize: '13px' }}>{t('includeAll')}</p>
            </div>

            <Button type="submit" className="w-full">
              {t('startSetup')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
