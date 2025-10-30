import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ChefHat, Plus, Minus } from 'lucide-react'

const schema = z.object({
  familyName: z.string().min(1, '請輸入家庭稱呼'),
})

type FormData = z.infer<typeof schema>

interface FamilySetupProps {
  onNext: (name: string, memberCount: number) => void
}

export default function FamilySetup({ onNext }: FamilySetupProps) {
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
    setMemberCount(prev => Math.max(1, Math.min(8, prev + delta)))
  }

  return (
    <div className="floating-card animate-slide-up">
      <div className="text-center mb-8">
        <div className="mx-auto mb-8 text-6xl animate-bounce-subtle">
          🍳
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-3 font-chinese leading-tight">
          煮食靈感不再煩惱！
        </h1>
        <h2 className="text-2xl font-medium text-primary-600 mb-4 font-chinese">
          開心煮食每一天
        </h2>
        <p className="text-warm-600 text-lg font-chinese leading-relaxed">
          讓我們為您的家庭設定個人化煮食助手
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="家庭稱呼"
          placeholder="例如：李太太一家"
          {...register('familyName')}
          error={errors.familyName?.message}
          className="font-chinese"
        />

        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-4 font-chinese">
            家中有幾多位成員？
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
              <span className="text-3xl font-bold text-primary-700 font-chinese">{memberCount}</span>
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
          <p className="text-sm text-warm-500 text-center mt-4 font-chinese">
            包括大人同小朋友
          </p>
        </div>

        <Button type="submit" className="w-full mt-8 font-chinese text-lg py-5">
          開始設定 ✨
        </Button>
      </form>
    </div>
  )
}
