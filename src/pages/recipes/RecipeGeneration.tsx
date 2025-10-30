import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { mockDataService } from '@/services/mockData'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Recipe, CuisineType } from '@/types'
import { CUISINE_OPTIONS } from '@/constants'
import { ArrowLeft, Clock, Users, ChefHat, Star } from 'lucide-react'

export default function RecipeGeneration() {
  const { state, setRecipes, setLoading } = useApp()
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(['chinese'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipes, setLocalRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    if (state.currentRecipes.length > 0) {
      setLocalRecipes(state.currentRecipes)
    }
  }, [state.currentRecipes])

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
      const generatedRecipes = await mockDataService.generateRecipes(availableIngredients)
      
      const filteredRecipes = generatedRecipes.filter(recipe =>
        selectedCuisines.includes(recipe.cuisine)
      )
      
      setLocalRecipes(filteredRecipes)
      setRecipes(filteredRecipes)
    } catch (error) {
      console.error('Failed to generate recipes:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-success-600'
      case 'medium': return 'text-warning-600'
      case 'hard': return 'text-error-600'
      default: return 'text-neutral-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Phone-style Header */}
        <div className="flex items-center py-4">
          <Link to="/" className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold gradient-text font-chinese whitespace-nowrap">煮食建議</h1>
          </div>
          <div className="w-9"></div>
        </div>

        {/* Cuisine Selection */}
        <div className="floating-card">
          <h2 className="section-title font-chinese whitespace-nowrap mb-4">選擇菜式風格</h2>
          <div className="grid grid-cols-3 gap-3">
            {CUISINE_OPTIONS.slice(0, 8).map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => toggleCuisine(cuisine.value)}
                className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                  selectedCuisines.includes(cuisine.value)
                    ? 'border-primary-400 bg-primary-50 shadow-md'
                    : 'border-warm-200 bg-white/60 hover:border-warm-300'
                }`}
              >
                <div className="text-lg mb-1">{cuisine.emoji}</div>
                <div className="text-xs font-medium text-warm-800 font-chinese whitespace-nowrap">{cuisine.label}</div>
              </button>
            ))}
            {/* Others option */}
            <button
              onClick={() => setSelectedCuisines(['fusion'])}
              className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                selectedCuisines.includes('fusion')
                  ? 'border-primary-400 bg-primary-50 shadow-md'
                  : 'border-warm-200 bg-white/60 hover:border-warm-300'
              }`}
            >
              <div className="text-lg mb-1">🌍</div>
              <div className="text-xs font-medium text-warm-800 font-chinese whitespace-nowrap">其他</div>
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateRecipes}
          className="w-full font-chinese text-lg py-4 whitespace-nowrap"
          isLoading={isGenerating}
          disabled={selectedCuisines.length === 0}
        >
          <ChefHat className="w-5 h-5 mr-2" />
          {isGenerating ? '生成食譜中...' : '獲取煮食靈感'}
        </Button>

        {/* Recipe Results */}
        {recipes.length > 0 && (
          <div className="space-y-4">
            <h2 className="section-title font-chinese whitespace-nowrap">建議食譜</h2>
            {recipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                <Card interactive className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-lg">{recipe.title}</h3>
                    <div className="flex items-center space-x-1 text-sm text-neutral-600">
                      <Star className="w-4 h-4" />
                      <span>{recipe.matchScore}%</span>
                    </div>
                  </div>
                  
                  <p className="text-neutral-600 text-sm mb-4">{recipe.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <span>{recipe.cookingTime}min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-neutral-500" />
                        <span>{recipe.servings}</span>
                      </div>
                      <span className={`capitalize ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                    
                    <div className="text-neutral-600">
                      {recipe.availableIngredients}/{recipe.totalIngredients} ingredients
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {recipes.length === 0 && !isGenerating && (
          <div className="floating-card text-center">
            <div className="text-4xl mb-4">👨‍🍳</div>
            <p className="text-warm-600 font-chinese">
              選擇喜愛菜式風格，然後獲取煮食建議
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
