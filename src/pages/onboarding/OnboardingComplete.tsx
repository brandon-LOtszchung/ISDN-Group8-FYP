import Button from '@/components/ui/Button'
import { Family } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApp } from '@/contexts/AppContext'
import { CheckCircle, Users } from 'lucide-react'

interface OnboardingCompleteProps {
  family: Family
  onComplete: () => void
  onEdit?: () => void
}

export default function OnboardingComplete({ family, onComplete, onEdit }: OnboardingCompleteProps) {
  const { state } = useApp()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-warm-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-fresh-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-fresh-600" strokeWidth={2} />
            </div>
            <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>Setup Complete</h1>
            <p className="text-warm-600" style={{ fontSize: '14px' }}>Family profile created successfully</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-warm-50 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <Users className="w-5 h-5 text-primary-500" strokeWidth={2} />
                <span className="font-bold text-warm-900" style={{ fontSize: '16px' }}>{family.name}</span>
              </div>
              <div className="text-warm-600" style={{ fontSize: '14px' }}>
                <p>{family.members?.length} family members</p>
              </div>
            </div>

            <div className="bg-warm-50 rounded-xl p-4">
              <h3 className="font-bold text-warm-900 mb-2" style={{ fontSize: '14px' }}>Members:</h3>
              <div className="space-y-1.5">
                {family.members?.map((member) => (
                  <div key={member.id} className="flex justify-between" style={{ fontSize: '14px' }}>
                    <span className="text-warm-700 font-medium">{member.name}</span>
                    <span className="text-warm-600">{member.age} {t('yearsOld')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={onComplete} 
              className="w-full"
              isLoading={state.isLoading}
            >
              {state.isLoading ? 'Saving...' : 'Start Using App'}
            </Button>
            {onEdit && (
              <Button 
                variant="outline"
                onClick={onEdit}
                className="w-full"
              >
                Edit Family Info
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
