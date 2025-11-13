import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Recipe } from '@/types'
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  ShoppingCart,
  ChevronDown,
} from 'lucide-react'

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const { state, addToShoppingList } = useApp()
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Recipe not found</p>
          <Link to="/recipes">
            <Button variant="outline">Back to Recipes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const availableIngredients = recipe.ingredients.filter((ing) => ing.available)
  const missingIngredients = recipe.ingredients.filter((ing) => !ing.available)
  const totalIngredients = recipe.ingredients.length
  const availableCount = availableIngredients.length

  const getStepImageUrl = (
    stepNumber: number,
    instructionText: string,
    imageUrl?: string
  ) => {
    if (imageUrl) return imageUrl

    const cleanedInstruction = instructionText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 5)
      .join('-')

    const query = `${recipe.cuisine}-${cleanedInstruction || `cooking-step-${stepNumber}`}`

    return `https://source.unsplash.com/600x400/?${query}`
  }

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-success-600 bg-success-50'
      case 'medium':
        return 'text-warning-600 bg-warning-50'
      case 'hard':
        return 'text-error-600 bg-error-50'
      default:
        return 'text-neutral-600 bg-neutral-50'
    }
  }

  const getAvailabilityBarColor = (available: number, total: number) => {
    if (total <= 0) return 'bg-neutral-300'
    if (available >= total) return 'bg-green-500'
    if (available <= 1) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 py-4">
          <Link to="/recipes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-medium">{recipe.title}</h1>
            <p className="text-sm text-neutral-600 capitalize">
              {recipe.cuisine} cuisine
            </p>
          </div>
        </div>

        {/* Recipe Info */}
        <Card className="p-6">
          <p className="text-neutral-700 mb-4">{recipe.description}</p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span>{recipe.cookingTime} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-neutral-500" />
                <span>{recipe.servings} servings</span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-sm capitalize ${getDifficultyColor(recipe.difficulty)}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Ingredients */}
        <Card className="p-6">
          <h2 className="section-title">Ingredients</h2>
          <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
            <span>Availability</span>
            <span>
              {availableCount}/{totalIngredients} ingredients
            </span>
          </div>
          <div
            className={`h-2 rounded-full mb-6 ${getAvailabilityBarColor(
              availableCount,
              totalIngredients
            )}`}
          />

          {availableIngredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-success-700 mb-3">
                ✓ You have ({availableIngredients.length})
              </h3>
              <div className="space-y-2">
                {availableIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-success-50 rounded-lg"
                  >
                    <span className="text-sm">{ingredient.name}</span>
                    <span className="text-sm text-neutral-600">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingIngredients.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                Need to buy ({missingIngredients.length})
              </h3>
              <div className="space-y-2">
                {missingIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg"
                  >
                    <span className="text-sm">{ingredient.name}</span>
                    <span className="text-sm text-neutral-600">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {missingIngredients.length > 0 && (
          <Button
            variant="primary"
            className="w-full text-lg py-4 font-chinese whitespace-nowrap"
            onClick={() => {
              addToShoppingList(missingIngredients)
              navigate('/shopping-list')
            }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add Missing Items to Shopping List
          </Button>
        )}

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setShowInstructions((prev) => !prev)}
          >
            View Instructions
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                showInstructions ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {showInstructions && (
            <Card className="p-6">
              <h2 className="section-title">Instructions</h2>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div
                    key={instruction.step}
                    className={`p-4 rounded-lg border transition-colors ${
                      index === activeStep
                        ? 'border-neutral-900 bg-neutral-50'
                        : index < activeStep
                          ? 'border-success-200 bg-success-50'
                          : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index < activeStep
                            ? 'bg-success-600 text-white'
                            : index === activeStep
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {index < activeStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          instruction.step
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{instruction.instruction}</p>
                        {instruction.duration && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Duration: {instruction.duration} minutes
                          </p>
                        )}
                        {instruction.temperature && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Temperature: {instruction.temperature}°C
                          </p>
                        )}
                        <div className="mt-4">
                          <img
                            src={getStepImageUrl(
                              instruction.step,
                              instruction.instruction,
                              instruction.imageUrl
                            )}
                            alt={`Step ${instruction.step}`}
                            className="w-full h-40 object-cover rounded-xl border border-neutral-200 shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setActiveStep(
                      Math.min(recipe.instructions.length - 1, activeStep + 1)
                    )
                  }
                  disabled={activeStep === recipe.instructions.length - 1}
                  className="flex-1"
                >
                  {activeStep === recipe.instructions.length - 1
                    ? 'Complete'
                    : 'Next Step'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
