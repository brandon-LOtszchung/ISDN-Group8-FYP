import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { mockDataService } from '@/services/mockData'
import Button from '@/components/ui/Button'
import DropdownButton from '@/components/ui/DropdownButton'
import { InterfaceLanguage, InventoryItem } from '@/types'
import { getMealTimeGreeting, getCurrentMealType, formatTime } from '@/utils'
import { Refrigerator, Clock, Users, ChefHat, Package } from 'lucide-react'

export default function Dashboard() {
  const { state, setInventory, setLoading } = useApp()
  const [displayLanguage, setDisplayLanguage] =
    useState<InterfaceLanguage>('en')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const inventory = await mockDataService.getInventory()
      setInventory(inventory)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  const currentMealType = getCurrentMealType()
  const greeting = getMealTimeGreeting()
  const mealTime =
    state.family?.preferences?.mealTimes?.[
      currentMealType as keyof typeof state.family.preferences.mealTimes
    ]

  const groupedInventory = state.inventory.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, InventoryItem[]>
  )

  const handleLanguageChange = (item: string) => {
    const selectedLocale =
      item === 'Chinese' ? 'zh-HK' : item === 'Filipino' ? 'fil' : 'en'
    const preferences = state.family?.preferences
    if (preferences) {
      preferences.preferredLanguage = selectedLocale
    }
    setDisplayLanguage(selectedLocale)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Header */}
        <DropdownButton
          variant="ghost"
          className="mx-auto mb-8 text-4xl"
          items={['English', 'Chinese', 'Filipino']}
          onSelect={(item) => handleLanguageChange(item)}
        >
          🌐
        </DropdownButton>
        <div className="text-center py-6 animate-fade-in">
          <div className="text-4xl mb-4 animate-bounce-subtle">🏠</div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-chinese whitespace-nowrap">
            {state.family?.preferences?.preferredLanguage === 'zh-HK'
              ? '你好！'
              : 'Hello!'}
            {/*{greeting === 'Good morning'
              ? '早晨！'
              : greeting === 'Good afternoon'
                ? '午安！'
                : '晚安！'} */}
          </h1>
          <p className="text-warm-600 text-lg font-medium font-chinese">
            {state.family?.name}
          </p>
          {/*<div className="badge mt-3 font-chinese">
            準備
            {currentMealType === 'breakfast'
              ? '早餐'
              : currentMealType === 'lunch'
                ? '午餐'
                : '晚餐'}
          </div>
          {currentMealType && (
            <div className="badge mt-3 font-chinese">
              準備
              {currentMealType === 'breakfast'
                ? '早餐'
                : currentMealType === 'lunch'
                  ? '午餐'
                  : '晚餐'}
            </div>
          )}
          {mealTime && (
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-warm-500">
              <Clock className="w-4 h-4" />
              <span className="font-chinese">通常{formatTime(mealTime)}</span>
            </div>
          )} */}
        </div>

        {/* Family Member Selection */}
        <div className="floating-card animate-slide-up">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-xl">👨‍👩‍👧‍👦</span>
            <h2 className="section-title mb-0 font-chinese whitespace-nowrap">
              今晚邊個食飯？
            </h2>
          </div>
          <div className="space-y-4">
            {state.family?.members?.map((member) => (
              <div
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedMembers.includes(member.id)
                    ? 'border-primary-400 bg-gradient-to-r from-primary-50 to-orange-50 shadow-lg'
                    : 'border-warm-200 bg-white/60 hover:border-warm-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-warm-800 font-chinese">
                      {member.name}
                    </p>
                    <p className="text-sm text-warm-600 font-chinese whitespace-nowrap">
                      {member.age}歲
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                      selectedMembers.includes(member.id)
                        ? 'border-primary-500 bg-primary-500 shadow-lg'
                        : 'border-warm-300'
                    }`}
                  >
                    {selectedMembers.includes(member.id) && (
                      <div className="w-full h-full rounded-full bg-white scale-50 animate-scale-in"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMembers(
                  state.family?.members?.map((m) => m.id) || []
                )
              }
              className="flex-1 font-chinese whitespace-nowrap"
            >
              全選
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMembers([])}
              className="flex-1 font-chinese whitespace-nowrap"
            >
              清除
            </Button>
          </div>
        </div>

        {/* Current Inventory */}
        <div className="floating-card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📦</span>
              <h2 className="section-title mb-0 font-chinese whitespace-nowrap">
                雪櫃存貨
              </h2>
            </div>
            <div className="badge font-chinese">
              {state.inventory.length}樣物品
            </div>
          </div>

          {state.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
              <p className="text-warm-500 font-chinese">載入存貨中...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedInventory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-warm-700 mb-3 capitalize flex items-center">
                    <span className="w-2 h-2 bg-gradient-to-r from-fresh-400 to-primary-500 rounded-full mr-2"></span>
                    {category.replace('-', ' ')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gradient-to-br from-white/90 to-orange-50/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <p className="text-sm font-semibold text-warm-800">
                          {item.name}
                        </p>
                        <p className="text-xs text-warm-600 mt-1">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="animate-slide-up">
          <Link to="/recipes" className="block">
            <Button
              className="w-full text-lg py-4 font-chinese whitespace-nowrap"
              disabled={selectedMembers.length === 0}
            >
              <ChefHat className="w-6 h-6 mr-3" />
              獲取煮食建議
            </Button>
          </Link>

          {selectedMembers.length === 0 && (
            <p className="text-center text-sm text-warm-500 mt-4 animate-bounce-subtle font-chinese">
              選擇家庭成員以獲得個人化食譜
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
