import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateInventoryItem, translateUnit } from '@/translations/inventory'
import { shareRecipe } from '@/utils/share'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { Recipe } from '@/types'
import { Clock, Users, CheckCircle, ShoppingCart, ChevronDown, Flame, Share2 } from 'lucide-react'

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const { state, addToShoppingList } = useApp()
  const { language, t } = useLanguage()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const foundRecipe = state.currentRecipes.find((r) => r.id === id)
    if (foundRecipe) {
      setRecipe(foundRecipe)
    }
  }, [id, state.currentRecipes])

  if (!recipe) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-4">
          <p className="text-warm-600" style={{ fontSize: '15px' }}>{t('recipeNotFound')}</p>
        </div>
      </Layout>
    )
  }

  const availableIngredients = recipe.ingredients.filter((ing) => ing.available)
  const missingIngredients = recipe.ingredients.filter((ing) => !ing.available)
  const totalIngredients = recipe.ingredients.length
  const availableCount = availableIngredients.length

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-fresh-100 text-fresh-700'
      case 'medium': return 'bg-primary-100 text-primary-700'
      case 'hard': return 'bg-coral-100 text-coral-700'
      default: return 'bg-warm-100 text-warm-700'
    }
  }

  const getAvailabilityBarColor = (available: number, total: number) => {
    if (total <= 0) return 'bg-warm-300'
    const percentage = (available / total) * 100
    if (percentage >= 100) return 'bg-fresh-500'
    if (percentage >= 60) return 'bg-primary-400'
    return 'bg-coral-400'
  }

  const handleShare = () => {
    shareRecipe(recipe, language)
  }

  return (
    <Layout showBack={true}>
      <div className="p-4 pb-6">
        {/* Recipe Header - Compact */}
        <section className="bg-white rounded-xl p-4 border border-warm-100 mb-4">
          <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '18px', lineHeight: '1.3' }}>
            {recipe.title}
          </h1>
          <p className="text-warm-600 mb-3" style={{ fontSize: '13px', lineHeight: '1.5' }}>
            {recipe.description}
          </p>

          <div className="flex items-center gap-3 text-warm-600" style={{ fontSize: '12px' }}>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{recipe.cookingTime}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{recipe.servings}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" strokeWidth={2} />
              <span className={`px-1.5 py-0.5 rounded font-bold ${getDifficultyColor(recipe.difficulty)}`} style={{ fontSize: '10px' }}>
                {recipe.difficulty}
              </span>
            </div>
          </div>
        </section>

        {/* Ingredients - Compact, Scrollable */}
        <section className="bg-white rounded-xl p-4 border border-warm-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-warm-900" style={{ fontSize: '16px' }}>{t('ingredientsList')}</h2>
            <span className="font-bold text-warm-600" style={{ fontSize: '12px' }}>
              {availableCount}/{totalIngredients}
            </span>
          </div>
          
          <div className="h-1.5 rounded-full bg-warm-200 overflow-hidden mb-3">
            <div
              className={`h-full transition-all ${getAvailabilityBarColor(availableCount, totalIngredients)}`}
              style={{ width: `${(availableCount / totalIngredients) * 100}%` }}
            />
          </div>

          <div className="max-h-40 overflow-y-auto space-y-3">
            {availableIngredients.length > 0 && (
              <div>
                <h3 className="font-bold text-fresh-700 mb-1.5 flex items-center gap-1" style={{ fontSize: '13px' }}>
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('haveIngredients')} ({availableIngredients.length})
                </h3>
                <div className="space-y-1">
                  {availableIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2.5 bg-fresh-50 rounded border border-fresh-200"
                    >
                      <span className="font-medium text-warm-900" style={{ fontSize: '13px' }}>
                        {translateInventoryItem(ingredient.name, language)}
                      </span>
                      <span className="text-warm-600 whitespace-nowrap ml-2" style={{ fontSize: '12px' }}>
                        {ingredient.quantity} {translateUnit(ingredient.unit, language)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {missingIngredients.length > 0 && (
              <div>
                <h3 className="font-bold text-warm-700 mb-1.5" style={{ fontSize: '13px' }}>
                  {t('needToBuy')} ({missingIngredients.length})
                </h3>
                <div className="space-y-1">
                  {missingIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2.5 bg-warm-50 rounded border border-warm-200"
                    >
                      <span className="font-medium text-warm-900" style={{ fontSize: '13px' }}>
                        {translateInventoryItem(ingredient.name, language)}
                      </span>
                      <span className="text-warm-600 whitespace-nowrap ml-2" style={{ fontSize: '12px' }}>
                        {ingredient.quantity} {translateUnit(ingredient.unit, language)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          {missingIngredients.length > 0 && (
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => {
                addToShoppingList(missingIngredients)
                navigate('/shopping-list')
              }}
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
              <span className="hidden sm:inline">{t('addToShoppingList')}</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleShare}
            className={missingIngredients.length > 0 ? 'flex items-center justify-center gap-2' : 'w-full flex items-center justify-center gap-2'}
          >
            <Share2 className="w-5 h-5" strokeWidth={2} />
            <span>{t('shareRecipe')}</span>
          </Button>
        </div>

        {/* Cooking Instructions - Collapsible */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowInstructions((prev) => !prev)}
        >
          <span>{showInstructions ? t('hideSteps') : t('viewSteps')} {t('cookingSteps')}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showInstructions ? 'rotate-180' : ''}`} strokeWidth={2} />
        </Button>

        {showInstructions && (
          <div className="mt-3 bg-white rounded-xl p-4 border border-warm-100 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {recipe.instructions.map((instruction, index) => (
                <div
                  key={instruction.step}
                  className={`p-3 rounded-lg transition-all ${
                    index === activeStep
                      ? 'bg-primary-50 border border-primary-400'
                      : index < activeStep
                        ? 'bg-fresh-50 border border-fresh-300'
                        : 'bg-warm-50 border border-warm-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                        index < activeStep
                          ? 'bg-fresh-500 text-white'
                          : index === activeStep
                            ? 'bg-primary-500 text-white'
                            : 'bg-warm-300 text-warm-700'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {index < activeStep ? <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} /> : instruction.step}
                    </div>
                    <p className="font-medium text-warm-900 flex-1" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {instruction.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="flex-1"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                {t('previousStep')}
              </Button>
              <Button
                onClick={() => setActiveStep(Math.min(recipe.instructions.length - 1, activeStep + 1))}
                disabled={activeStep === recipe.instructions.length - 1}
                className="flex-1"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                {activeStep === recipe.instructions.length - 1 ? t('done') : t('nextStep')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
