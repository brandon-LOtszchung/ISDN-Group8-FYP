import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useApp } from '@/contexts/AppContext'
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react'

export default function ShoppingList() {
  const {
    state: { shoppingList },
    removeFromShoppingList,
    clearShoppingList,
  } = useApp()

  const handleRemove = (name: string, unit: string) => {
    removeFromShoppingList({ name, unit })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center py-4">
          <Link to="/recipes" className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold gradient-text font-chinese whitespace-nowrap">
              購物清單
            </h1>
            <p className="text-sm text-warm-500 font-chinese">
              記錄需要購買的食材
            </p>
          </div>
          <div className="w-9" />
        </div>

        {shoppingList.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <div className="text-4xl">🛒</div>
            <p className="text-warm-600 font-chinese">
              暫時沒有需要購買的食材，
              <span className="block mt-1">檢視食譜以新增項目。</span>
            </p>
            <Link to="/recipes">
              <Button className="w-full font-chinese whitespace-nowrap">
                返回食譜
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-title mb-1 font-chinese whitespace-nowrap">
                    需要購買的食材
                  </h2>
                  <p className="text-sm text-warm-500 font-chinese">
                    共{shoppingList.length}項
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-chinese whitespace-nowrap"
                  onClick={clearShoppingList}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空列表
                </Button>
              </div>

              <div className="space-y-3">
                {shoppingList.map((item) => (
                  <div
                    key={`${item.name}-${item.unit}`}
                    className="flex items-center justify-between p-4 rounded-2xl border border-warm-200 bg-white/80 shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-warm-800 capitalize">
                        {item.name}
                      </p>
                      <p className="text-sm text-warm-600">
                        {item.quantity} {item.unit}
                      </p>
                      {item.alternatives && item.alternatives.length > 0 && (
                        <p className="text-xs text-warm-500 mt-1">
                          可替代：{item.alternatives.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.name, item.unit)}
                      className="p-2 text-warm-500 hover:text-warm-700 transition-colors"
                      aria-label={`移除${item.name}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 text-warm-600">
                <ShoppingCart className="w-5 h-5" />
                <p className="text-sm font-chinese">
                  小提示：購物前再次檢查雪櫃，避免重複購買。
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

