import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { dataService } from '@/services/dataService'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { CuisineType } from '@/types'
import { CUISINE_OPTIONS } from '@/constants'
import { Clock, Users, TrendingUp, Package } from 'lucide-react'

export default function RecipeGeneration() {
  const { state, setRecipes } = useApp()
  const { t } = useLanguage()
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(['chinese'])
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  const generateRecipes = async () => {
    try {
      setIsGenerating(true)
      const availableIngredients = state.inventory.map(item => item.name)
      
      // Collect all dietary restrictions and allergies from family members
      const allDietaryRestrictions = Array.from(new Set(
        state.family?.members.flatMap(m => m.dietaryRestrictions) || []
      ))
      const allAllergies = Array.from(new Set(
        state.family?.members.flatMap(m => m.allergies) || []
      ))
      
      const generatedRecipes = await dataService.generateRecipes(
        availableIngredients,
        selectedCuisines,
        allDietaryRestrictions,
        allAllergies,
        state.family?.members.length || 4
      )
      
      setRecipes(generatedRecipes)
    } catch (error) {
      console.error('Failed to generate recipes:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getAvailabilityBarColor = (available: number, total: number) => {
    if (total <= 0) return 'bg-warm-300'
    const percentage = (available / total) * 100
    if (percentage >= 100) return 'bg-fresh-500'
    if (percentage >= 60) return 'bg-primary-400'
    return 'bg-coral-400'
  }

  return (
    <Layout showBack={true}>
      <div className="p-4 pb-6">
        {/* Cuisine Selection - Horizontal Scroll */}
        <section className="mb-4">
          <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: '18px' }}>
            {t('selectCuisine')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {CUISINE_OPTIONS.map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => toggleCuisine(cuisine.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                  selectedCuisines.includes(cuisine.value)
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-warm-200'
                }`}
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                {t(cuisine.value)}
              </button>
            ))}
          </div>
        </section>

        {/* Generate Button */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={generateRecipes}
            className="flex-1"
            isLoading={isGenerating}
            disabled={selectedCuisines.length === 0}
          >
            {isGenerating ? t('generating') : t('getRecipe')}
          </Button>
          
          {state.currentRecipes.length > 0 && !isGenerating && (
            <Button
              onClick={generateRecipes}
              variant="outline"
              className="px-4"
            >
              {t('generateMore')}
            </Button>
          )}
        </div>

        {/* Recipe Results - Scrollable List */}
        {state.currentRecipes.length > 0 && (
          <section>
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: '18px' }}>
              {t('suggestedRecipes')}
            </h2>
            <div className="space-y-2">
              {state.currentRecipes.map((recipe) => (
                <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                  <div className="bg-white rounded-xl p-4 border border-warm-200 active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-warm-900 flex-1" style={{ fontSize: '16px', lineHeight: '1.3' }}>
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-1 text-primary-600 ml-3">
                        <TrendingUp className="w-4 h-4" strokeWidth={2} />
                        <span className="font-bold" style={{ fontSize: '13px' }}>{recipe.matchScore}%</span>
                      </div>
                    </div>
                    
                    <p className="text-warm-600 mb-2 line-clamp-2" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      {recipe.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-warm-600" style={{ fontSize: '12px' }}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{recipe.cookingTime}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{recipe.servings}</span>
                        </div>
                      </div>
                      
                      <div className="text-warm-700 font-bold" style={{ fontSize: '12px' }}>
                        {recipe.availableIngredients}/{recipe.totalIngredients}
                      </div>
                    </div>

                    <div className="h-1 rounded-full bg-warm-200 overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all ${getAvailabilityBarColor(
                          recipe.availableIngredients ?? 0,
                          recipe.totalIngredients ?? 0
                        )}`}
                        style={{ width: `${((recipe.availableIngredients ?? 0) / recipe.totalIngredients) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {state.currentRecipes.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-warm-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-warm-500" style={{ fontSize: '14px' }}>{t('selectThenGenerate')}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
