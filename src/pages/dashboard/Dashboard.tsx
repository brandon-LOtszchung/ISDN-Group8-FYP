import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateInventoryItem, translateUnit } from '@/translations/inventory'
import { dataService } from '@/services/dataService'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { InventoryItem } from '@/types'
import { ChevronDown, Package, X } from 'lucide-react'

export default function Dashboard() {
  const { state, setInventory, setLoading } = useApp()
  const { language, t } = useLanguage()
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const inventory = await dataService.getInventory()
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

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm(t('removeConfirm') || 'Remove this item?')) return
    
    try {
      setRemovingItemId(itemId)
      await dataService.removeInventoryItem(itemId)
      
      // Reload inventory
      const updatedInventory = await dataService.getInventory()
      setInventory(updatedInventory)
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setRemovingItemId(null)
    }
  }

  const groupedInventory = state.inventory.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, InventoryItem[]>
  )

  return (
    <Layout title={state.family?.name}>
      <div className="p-4 pb-6">
        {/* Who's Eating - Horizontal Scroll */}
        <section className="mb-5">
          <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: '18px' }}>
            {t('whoEating')}
          </h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {state.family?.members?.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                  selectedMembers.includes(member.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-warm-200 text-warm-900'
                }`}
                style={{ minWidth: '120px' }}
              >
                <div className="text-center">
                  <p className="font-semibold" style={{ fontSize: '15px' }}>
                    {member.name}
                  </p>
                  <p className="opacity-70 mt-0.5" style={{ fontSize: '13px' }}>
                    {member.age} {t('yearsOld')}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => setSelectedMembers(state.family?.members?.map((m) => m.id) || [])}
              className="flex-1"
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              {t('selectAll')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedMembers([])}
              className="flex-1"
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              {t('clear')}
            </Button>
          </div>
        </section>

        {/* Fridge Inventory - Collapsible */}
        <section className="mb-5">
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" strokeWidth={2} />
              <h2 className="font-bold text-warm-900" style={{ fontSize: '18px' }}>
                {t('fridgeInventory')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded font-bold" style={{ fontSize: '12px' }}>
                {state.inventory.length}
              </span>
              <ChevronDown className={`w-5 h-5 text-warm-500 transition-transform ${showInventory ? 'rotate-180' : ''}`} strokeWidth={2} />
            </div>
          </button>

          {showInventory && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(groupedInventory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-bold text-warm-700 mb-1.5" style={{ fontSize: '13px' }}>
                    {t(category as keyof typeof import('@/translations').translations.en)}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg px-3 py-2 border border-warm-200 flex items-center justify-between group"
                      >
                        <p className="font-semibold text-warm-900" style={{ fontSize: '14px' }}>
                          {translateInventoryItem(item.name, language)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-warm-600 font-medium whitespace-nowrap" style={{ fontSize: '13px' }}>
                            {item.quantity} {translateUnit(item.unit, language)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removingItemId === item.id}
                            className="opacity-0 group-hover:opacity-100 p-1 text-coral-500 hover:text-coral-700 transition-all disabled:opacity-50"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Action Button */}
        <section>
          <Link to="/recipes">
            <Button
              className="w-full"
              disabled={selectedMembers.length === 0}
            >
              {t('getRecipes')}
            </Button>
          </Link>

          {selectedMembers.length === 0 && (
            <p className="text-center text-warm-500 mt-2" style={{ fontSize: '13px' }}>
              {t('selectMembers')}
            </p>
          )}
        </section>
      </div>
    </Layout>
  )
}
