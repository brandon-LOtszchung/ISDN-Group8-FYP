import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Layout from '@/components/Layout'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateInventoryItem, translateUnit } from '@/translations/inventory'
import { Trash2, ShoppingCart, Package } from 'lucide-react'

export default function ShoppingList() {
  const {
    state: { shoppingList },
    removeFromShoppingList,
    clearShoppingList,
  } = useApp()
  const { language, t } = useLanguage()

  const handleRemove = (name: string, unit: string) => {
    removeFromShoppingList({ name, unit })
  }

  return (
    <Layout showBack={true}>
      <div className="p-4 pb-6">
        {shoppingList.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-warm-400" strokeWidth={1.5} />
            </div>
            <p className="text-warm-600 mb-2" style={{ fontSize: '15px' }}>
              {t('emptyShoppingList')}
            </p>
            <p className="text-warm-500 mb-6" style={{ fontSize: '13px' }}>
              {t('emptyShoppingListDesc')}
            </p>
            <Link to="/recipes">
              <Button className="mx-auto">
                {t('recipeTitle')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Shopping List Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-warm-900" style={{ fontSize: '18px' }}>
                  {t('itemsToBuy')}
                </h2>
                <p className="text-warm-600" style={{ fontSize: '13px' }}>
                  {t('total')} {shoppingList.length} {t('items')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={clearShoppingList}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                <Trash2 className="w-4 h-4 mr-1" strokeWidth={2} />
                {t('clearList')}
              </Button>
            </div>

            {/* Shopping Items */}
            <div className="space-y-2 mb-5">
              {shoppingList.map((item) => (
                <div
                  key={`${item.name}-${item.unit}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-warm-200 bg-white"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-warm-900" style={{ fontSize: '15px' }}>
                      {translateInventoryItem(item.name, language)}
                    </p>
                    <p className="text-warm-600" style={{ fontSize: '13px' }}>
                      {item.quantity} {translateUnit(item.unit, language)}
                    </p>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <p className="text-warm-500 mt-1" style={{ fontSize: '12px' }}>
                        {t('alternatives')}: {item.alternatives.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item.name, item.unit)}
                    className="p-2 text-warm-400 hover:text-coral-600 transition-colors ml-3"
                    aria-label={`${t('remove')} ${item.name}`}
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>

            {/* Shopping Tip */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-primary-700" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                {t('shoppingTip')}
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
