import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Family } from '@/types'
import { CheckCircle, Users } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface OnboardingCompleteProps {
  family: Family
  onComplete: () => void
  onEdit?: () => void
}

export default function OnboardingComplete({ family, onComplete, onEdit }: OnboardingCompleteProps) {
  const { state } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="floating-card animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold gradient-text font-chinese whitespace-nowrap mb-2">設定完成！</h1>
            <p className="text-warm-600 font-chinese">家庭資料已建立</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white/60 rounded-2xl p-4 border border-white/50">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-lg">🏠</span>
                <span className="font-medium font-chinese">{family.name}</span>
              </div>
              <div className="text-sm text-warm-600 font-chinese space-y-1">
                <p>{family.members?.length}位家庭成員</p>
                <p>煮食技巧：{family.preferences?.cookingSkillLevel === 'beginner' ? '新手' : family.preferences?.cookingSkillLevel === 'intermediate' ? '一般' : '高手'}</p>
                <p>預算：{family.preferences?.budgetRange === 'low' ? '慳錢' : family.preferences?.budgetRange === 'medium' ? '適中' : '豐富'}</p>
              </div>
            </div>

            <div className="bg-white/60 rounded-2xl p-4 border border-white/50">
              <h3 className="font-medium mb-3 font-chinese">家庭成員：</h3>
              <div className="space-y-2">
                {family.members?.map((member) => (
                  <div key={member.id} className="flex justify-between text-sm">
                    <span className="font-chinese">{member.name}</span>
                    <span className="text-warm-600 font-chinese">{member.age}歲</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onComplete} 
              className="w-full font-chinese text-lg py-5 whitespace-nowrap"
              isLoading={state.isLoading}
            >
              {state.isLoading ? '儲存中...' : '開始使用🚀'}
            </Button>
            {onEdit && (
              <Button 
                variant="outline"
                onClick={onEdit}
                className="w-full font-chinese text-lg py-5 whitespace-nowrap"
              >
                重新設定家庭資料
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
