import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useApp } from '@/contexts/AppContext'
import { mockDataService } from '@/services/mockData'
import { Refrigerator, CheckCircle, AlertCircle } from 'lucide-react'

type InitStep = 'instructions' | 'removing' | 'restocking' | 'complete'

const TUTORIAL_STEPS = [
  {
    id: 'clear',
    title: '全面清空雪櫃',
    description: '取出所有食材與包裝，有助感應器重新校準基準值。',
    image:
      'https://images.unsplash.com/photo-1612872087720-bb876e3c469b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'organize',
    title: '按層整理分類',
    description: '將常用、易壞的食材先放在前排，方便後續監察與補貨。',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'restock',
    title: '逐件放回並記錄',
    description: '每放回一件物品稍停一秒，讓系統偵測重量和位置。',
    image:
      'https://images.unsplash.com/photo-1606811841689-23dfddce3b03?auto=format&fit=crop&w=600&q=80',
  },
] as const

export default function FridgeInitialization() {
  const { setLoading, setError, initializeFridge, setInventory } = useApp()
  const [currentStep, setCurrentStep] = useState<InitStep>('instructions')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStartInitialization = async () => {
    setCurrentStep('removing')
  }

  const handleItemsRemoved = () => {
    setCurrentStep('restocking')
  }

  const handleRestockingComplete = async () => {
    try {
      setIsProcessing(true)
      setLoading(true)
      
      const result = await mockDataService.initializeFridge()
      
      if (result.success) {
        const inventory = await mockDataService.getInventory()
        setInventory(inventory)
        setCurrentStep('complete')
      } else {
        setError('Failed to initialize fridge')
      }
    } catch (error) {
      setError('Failed to initialize fridge')
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const handleComplete = () => {
    initializeFridge()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'instructions':
        return (
          <div className="text-center">
            <div className="text-5xl mb-6">🧊</div>
            <h1 className="text-2xl font-bold gradient-text mb-4 font-chinese whitespace-nowrap">智能雪櫃設定</h1>
            <p className="text-warm-600 mb-6 font-chinese">
              需要校準系統，學習雪櫃內的物品
            </p>
            
            <div className="bg-white/60 rounded-2xl p-6 mb-6 text-left border border-white/50">
              <h3 className="font-medium mb-4 font-chinese">設定步驟：</h3>
              <div className="space-y-3 text-sm text-warm-700">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span className="font-chinese">清空雪櫃所有物品</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span className="font-chinese">逐一放回物品（感應器會偵測）</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span className="font-chinese">系統建立初始清單</span>
                </div>
              </div>
            </div>

            <div className="bg-white/40 rounded-2xl p-6 mb-8 border border-white/60">
              <div className="flex items-center justify-center gap-2 text-primary-600 mb-4">
                <Refrigerator className="w-5 h-5" />
                <span className="text-sm font-semibold font-chinese tracking-wide">快速教學 · 請跟住以下示範</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {TUTORIAL_STEPS.map((step) => (
                  <Card
                    key={step.id}
                    padding="sm"
                    className="min-w-[220px] bg-white/80 border border-white/70 rounded-2xl shadow-sm snap-center"
                  >
                    <div className="h-32 rounded-xl overflow-hidden mb-3">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-warm-800 mb-2 font-chinese">{step.title}</h4>
                    <p className="text-xs text-warm-600 font-chinese leading-relaxed">{step.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            <Button onClick={handleStartInitialization} className="w-full font-chinese whitespace-nowrap">
              開始設定
            </Button>
          </div>
        )

      case 'removing':
        return (
          <div className="text-center">
            <div className="text-5xl mb-6">📤</div>
            <h1 className="text-2xl font-bold gradient-text mb-4 font-chinese whitespace-nowrap">清空雪櫃</h1>
            <p className="text-warm-600 mb-6 font-chinese">
              請清空雪櫃所有物品，幫助系統建立基準
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <p className="text-sm text-orange-700 font-chinese text-left">
                確保雪櫃完全清空才繼續
              </p>
            </div>

            <Button onClick={handleItemsRemoved} className="w-full font-chinese whitespace-nowrap">
              已清空所有物品
            </Button>
          </div>
        )

      case 'restocking':
        return (
          <div className="text-center">
            <div className="text-5xl mb-6">📥</div>
            <h1 className="text-2xl font-bold gradient-text mb-4 font-chinese whitespace-nowrap">重新入貨</h1>
            <p className="text-warm-600 mb-6 font-chinese">
              現在逐一放回物品，感應器會偵測每件物品
            </p>
            
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5" />
                <p className="text-sm text-primary-700 font-chinese">
                  慢慢來，系統需要清楚識別每件物品
                </p>
              </div>
            </div>

            <Button 
              onClick={handleRestockingComplete} 
              className="w-full font-chinese whitespace-nowrap"
              isLoading={isProcessing}
            >
              {isProcessing ? '處理中...' : '完成入貨'}
            </Button>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center">
            <div className="text-5xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold gradient-text mb-4 font-chinese whitespace-nowrap">初始化完成！</h1>
            <p className="text-warm-600 mb-6 font-chinese">
              智能雪櫃已準備就緒，物品已偵測並記錄
            </p>
            
            <div className="bg-fresh-50 border border-fresh-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-fresh-700 font-chinese">
                雪櫃清單現在會自動追蹤
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full font-chinese whitespace-nowrap">
              開始使用智能雪櫃
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="floating-card animate-slide-up">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
