import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApp } from '@/contexts/AppContext'
import { CUISINE_OPTIONS } from '@/constants'
import { recommendRecipes, getRecipeDetail, addToShoppingList, type RecipeRecommendation, type RecipeDetail } from '@/services/recipeApi'
import { getRecipeCost, getShoppingList, updateShoppingListItem, deleteShoppingListItems, type ShoppingListItem, supabase } from '@/services/supabase'
import { shareRecipe } from '@/utils/share'

type View = 'food-idea' | 'recipe-detail' | 'shopping-list'

export default function PlanningPage() {
  const { colors } = useTheme()
  const { t: _t } = useLanguage()
  const { state } = useApp()
  const [view, setView] = useState<View>('food-idea')
  
  // Food Idea state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [recipes, setRecipes] = useState<(RecipeRecommendation & { estimatedCost: number | null })[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [_processingMessage, setProcessingMessage] = useState('')
  const [typedMessage, setTypedMessage] = useState('')
  
  // Recipe detail state
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null)
  const [recipeDetailTab, setRecipeDetailTab] = useState<'steps' | 'ingredients'>('steps')
  const [_isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Shopping list state
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])
  const [activeSection, setActiveSection] = useState<'food-idea' | 'shopping-list'>('food-idea')
  
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messageIndexRef = useRef(0)
  const charIndexRef = useRef(0)

  // Initialize selected members when family loads
  useEffect(() => {
    if (state.family && state.family.members.length > 0 && selectedMembers.length === 0) {
      // Select all members by default
      setSelectedMembers(state.family.members.map(m => m.id))
    }
  }, [state.family, selectedMembers.length])

  // Load shopping list
  useEffect(() => {
    const loadShoppingList = async () => {
      const list = await getShoppingList()
      setShoppingList(list)
    }
    loadShoppingList()
  }, [])

  // Set up Supabase realtime subscription for shopping list
  useEffect(() => {
    try {
      const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'
      
      const channel = supabase
        .channel('shopping-list-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_list_items',
            filter: `family_id=eq.${DEFAULT_FAMILY_ID}`,
          },
          async () => {
            try {
              const list = await getShoppingList()
              setShoppingList(list)
            } catch (error) {
              console.error('Error refreshing shopping list:', error)
            }
          }
        )
        .subscribe()

      return () => {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.error('Error removing channel:', error)
        }
      }
    } catch (error) {
      console.error('Error setting up shopping list subscription:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTypingEffect = (messages: string[]) => {
    messageIndexRef.current = 0
    charIndexRef.current = 0
    setTypedMessage('')
    setProcessingMessage(messages[0])

    const typeChar = () => {
      const currentMessage = messages[messageIndexRef.current]
      if (charIndexRef.current < currentMessage.length) {
        setTypedMessage(currentMessage.substring(0, charIndexRef.current + 1))
        charIndexRef.current++
      } else {
        clearInterval(typingIntervalRef.current!)
        if (messageIndexRef.current < messages.length - 1) {
          messageIndexRef.current++
          charIndexRef.current = 0
          setTimeout(() => {
            setTypedMessage('')
            setProcessingMessage(messages[messageIndexRef.current])
            typingIntervalRef.current = setInterval(typeChar, 50)
          }, 1000)
        }
      }
    }
    typingIntervalRef.current = setInterval(typeChar, 50)
  }

  const handleGetRecipes = async () => {
    if (selectedMembers.length === 0 || !selectedCuisine) return

    try {
      setIsLoadingRecipes(true)
      setRecipes([])
      
      const messages = [
        'Finding perfect recipes...',
        'Considering dietary restrictions...',
        'Matching with your inventory...',
        'Almost ready!'
      ]
      
      startTypingEffect(messages)
      
      // Wait for typing effect to complete (approximate 5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const recommendations = await recommendRecipes(selectedMembers, selectedCuisine)
      
      // Fetch estimated costs for each recipe
      const recipesWithCosts = await Promise.all(
        recommendations.map(async (recipe) => {
          const cost = await getRecipeCost(recipe.saved_recipe_id)
          return { ...recipe, estimatedCost: cost }
        })
      )
      
      setRecipes(recipesWithCosts)
      setProcessingMessage('')
      setTypedMessage('')
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
    } catch (error) {
      console.error('Error getting recipes:', error)
      setProcessingMessage('')
      setTypedMessage('')
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
      alert('Failed to get recipes. Please try again.')
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const handleRecipeClick = async (recipe: RecipeRecommendation) => {
    try {
      setIsLoadingDetail(true)
      const detail = await getRecipeDetail(recipe.saved_recipe_id)
      setSelectedRecipe(detail)
      setView('recipe-detail')
    } catch (error) {
      console.error('Error getting recipe detail:', error)
      alert('Failed to load recipe details. Please try again.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedRecipe) return

    try {
      setIsAddingToCart(true)
      await addToShoppingList(selectedRecipe.saved_recipe_id)
      // Refresh shopping list
      const list = await getShoppingList()
      setShoppingList(list)
      alert('Added to shopping list!')
      setView('food-idea')
      setSelectedRecipe(null)
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to shopping list. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleShare = async (recipe: RecipeRecommendation & { estimatedCost: number | null }) => {
    await shareRecipe(
      recipe.name,
      recipe.saved_recipe_id,
      recipe.matched_count,
      recipe.total_count,
      recipe.estimatedCost
    )
  }

  const handleClearPurchased = async () => {
    const purchasedIds = shoppingList.filter(i => i.is_purchased).map(i => i.id)
    if (purchasedIds.length === 0) return
    await deleteShoppingListItems(purchasedIds)
    const list = await getShoppingList()
    setShoppingList(list)
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Cleanup typing interval
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
    }
  }, [])

  if (view === 'recipe-detail' && selectedRecipe) {
    return (
      <div style={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: colors.background,
          paddingTop: '20px',
          paddingBottom: '100px',
          transition: 'background-color 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Back button */}
          <button
            onClick={() => {
              setView('food-idea')
              setSelectedRecipe(null)
            }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 10,
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: colors.text,
              cursor: 'pointer',
              padding: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-4px)'
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.opacity = '1'
            }}
          >
            ←
          </button>

          <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '24px',
              marginTop: '40px'
            }}>
              {selectedRecipe.name}
            </h1>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: `2px solid ${colors.border}`
            }}>
              <button
                onClick={() => setRecipeDetailTab('steps')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: recipeDetailTab === 'steps' ? colors.primary : colors.text,
                  fontSize: '16px',
                  fontWeight: recipeDetailTab === 'steps' ? 600 : 500,
                  borderBottom: recipeDetailTab === 'steps' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cooking Steps
              </button>
              <button
                onClick={() => setRecipeDetailTab('ingredients')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: recipeDetailTab === 'ingredients' ? colors.primary : colors.text,
                  fontSize: '16px',
                  fontWeight: recipeDetailTab === 'ingredients' ? 600 : 500,
                  borderBottom: recipeDetailTab === 'ingredients' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Ingredients
              </button>
            </div>

            {/* Tab content */}
            {recipeDetailTab === 'steps' && (
              <div style={{
                padding: '20px 0'
              }}>
                {selectedRecipe.steps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      marginBottom: '16px',
                      backgroundColor: `${colors.primary}10`,
                      borderLeft: `4px solid ${colors.primary}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.primary,
                      marginBottom: '8px'
                    }}>
                      Step {index + 1}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: colors.text,
                      lineHeight: '1.6'
                    }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recipeDetailTab === 'ingredients' && (
              <div style={{
                padding: '20px 0'
              }}>
                {/* Ingredients we have */}
                {selectedRecipe.ingredients.filter(ing => ing.required).length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      backgroundColor: `${colors.success}12`,
                      borderRadius: '10px',
                      marginBottom: '12px',
                    }}>
                      <span style={{ fontSize: '20px' }}>✓</span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: colors.success }}>We Have</div>
                        <div style={{ fontSize: '12px', color: colors.success, opacity: 0.8 }}>
                          {selectedRecipe.matched_count} items in your fridge
                        </div>
                      </div>
                    </div>
                    {selectedRecipe.ingredients.filter(ing => ing.required).map((ing, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          backgroundColor: `${colors.success}15`,
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: colors.success, fontWeight: 600, marginRight: '8px', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '16px', color: colors.text }}>{ing.name}</span>
                        <span style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing ingredients */}
                {selectedRecipe.missing_ingredients.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      backgroundColor: `${colors.danger}10`,
                      borderRadius: '10px',
                      marginBottom: '12px',
                    }}>
                      <span style={{ fontSize: '20px' }}>✗</span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: colors.danger }}>Need to Buy</div>
                        <div style={{ fontSize: '12px', color: colors.danger, opacity: 0.8 }}>
                          {selectedRecipe.missing_ingredients.length} items missing
                        </div>
                      </div>
                    </div>
                    {selectedRecipe.missing_ingredients.map((ing, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          backgroundColor: `${colors.danger}15`,
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: colors.danger, fontWeight: 600, marginRight: '8px', flexShrink: 0 }}>✗</span>
                        <div>
                          <span style={{ fontSize: '16px', color: colors.text }}>{ing.name}</span>
                          {ing.alternatives.length > 0 && (
                            <div style={{ fontSize: '12px', color: colors.text, opacity: 0.6, marginTop: '4px' }}>
                              Alternatives: {ing.alternatives.join(', ')}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || selectedRecipe.missing_ingredients.length === 0}
              style={{
                position: 'fixed',
                bottom: '100px',
                left: '20px',
                right: '20px',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '18px',
                border: 'none',
                background: isAddingToCart || selectedRecipe.missing_ingredients.length === 0
                  ? colors.border
                  : `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                color: '#FFFFFF',
                fontSize: '17px',
                fontWeight: 600,
                borderRadius: '16px',
                cursor: isAddingToCart || selectedRecipe.missing_ingredients.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: selectedRecipe.missing_ingredients.length > 0 ? `0 4px 16px ${colors.primary}40` : 'none',
                opacity: isAddingToCart || selectedRecipe.missing_ingredients.length === 0 ? 0.5 : 1
              }}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Shopping Cart'}
            </button>
          </div>
        </div>
    )
  }

  return (
    <>
      <div style={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: colors.background,
          paddingTop: '20px',
          paddingBottom: '100px',
          transition: 'background-color 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
        {/* Background gradients */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${colors.scan}20 0%, ${colors.scan}10 50%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '350px',
          height: '350px',
          background: `radial-gradient(circle, ${colors.primary}20 0%, ${colors.primary}10 50%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 12s ease-in-out infinite',
          animationDelay: '1s',
          zIndex: 0
        }} />

        <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
          {/* Section tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: `2px solid ${colors.border}`
          }}>
            <button
              onClick={() => setActiveSection('food-idea')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'transparent',
                color: activeSection === 'food-idea' ? colors.primary : colors.text,
                fontSize: '16px',
                fontWeight: activeSection === 'food-idea' ? 600 : 500,
                borderBottom: activeSection === 'food-idea' ? `3px solid ${colors.primary}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Food Idea
            </button>
            <button
              onClick={() => setActiveSection('shopping-list')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'transparent',
                color: activeSection === 'shopping-list' ? colors.primary : colors.text,
                fontSize: '16px',
                fontWeight: activeSection === 'shopping-list' ? 600 : 500,
                borderBottom: activeSection === 'shopping-list' ? `3px solid ${colors.primary}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Shopping List
            </button>
          </div>

          {activeSection === 'food-idea' && (
            <div>
              {/* Member selection */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '16px'
                }}>
                  Who's eating?
                </h2>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {state.family?.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMemberSelection(member.id)}
                      style={{
                        padding: '12px 20px',
                        border: `2px solid ${selectedMembers.includes(member.id) ? colors.primary : colors.border}`,
                        background: selectedMembers.includes(member.id)
                          ? `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`
                          : colors.background,
                        color: selectedMembers.includes(member.id) ? '#FFFFFF' : colors.text,
                        fontSize: '16px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: selectedMembers.includes(member.id) ? `0 4px 12px ${colors.primary}40` : 'none'
                      }}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine selection */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '16px'
                }}>
                  Choose a cuisine
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px'
                }}>
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <button
                      key={cuisine.value}
                      onClick={() => setSelectedCuisine(cuisine.value)}
                      style={{
                        padding: '16px',
                        border: `2px solid ${selectedCuisine === cuisine.value ? colors.primary : colors.border}`,
                        background: selectedCuisine === cuisine.value
                          ? `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`
                          : colors.background,
                        color: selectedCuisine === cuisine.value ? '#FFFFFF' : colors.text,
                        fontSize: '16px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: selectedCuisine === cuisine.value ? `0 4px 12px ${colors.primary}40` : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{cuisine.emoji}</span>
                      <span>{cuisine.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Get recipes button */}
              <button
                onClick={handleGetRecipes}
                disabled={selectedMembers.length === 0 || !selectedCuisine || isLoadingRecipes}
                style={{
                  width: '100%',
                  padding: '18px',
                  border: 'none',
                  background: (selectedMembers.length === 0 || !selectedCuisine || isLoadingRecipes)
                    ? colors.border
                    : `linear-gradient(135deg, ${colors.scan}, ${colors.scan}dd)`,
                  color: '#FFFFFF',
                  fontSize: '17px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  cursor: (selectedMembers.length === 0 || !selectedCuisine || isLoadingRecipes) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: (selectedMembers.length > 0 && selectedCuisine && !isLoadingRecipes) ? `0 4px 16px ${colors.scan}40` : 'none',
                  opacity: (selectedMembers.length === 0 || !selectedCuisine || isLoadingRecipes) ? 0.5 : 1,
                  marginBottom: '32px'
                }}
              >
                Get Recipe Ideas
              </button>

              {/* Loading state */}
              {isLoadingRecipes && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: colors.text
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    minHeight: '24px'
                  }}>
                    {typedMessage}
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '20px',
                      backgroundColor: colors.primary,
                      marginLeft: '2px',
                      animation: 'blink 1s infinite',
                      verticalAlign: 'middle'
                    }} />
                  </div>
                </div>
              )}

              {/* Recipe list */}
              {!isLoadingRecipes && recipes.length > 0 && (
                <div>
                  {recipes.map((recipe) => {
                    const matchPercentage = (recipe.matched_count / recipe.total_count) * 100
                    const barColor = matchPercentage >= 70 ? colors.success : matchPercentage >= 40 ? colors.scan : colors.danger

                    return (
                      <div
                        key={recipe.saved_recipe_id}
                        onClick={() => handleRecipeClick(recipe)}
                        style={{
                          padding: '20px',
                          marginBottom: '16px',
                          backgroundColor: colors.background,
                          border: `2px solid ${colors.border}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: `0 2px 8px ${colors.border}20`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = `0 8px 16px ${colors.primary}30`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = `0 2px 8px ${colors.border}20`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <h3 style={{
                            fontSize: '20px',
                            fontWeight: 600,
                            color: colors.text,
                            flex: 1
                          }}>
                            {recipe.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShare(recipe)
                            }}
                            style={{
                              padding: '8px 12px',
                              border: `1px solid ${colors.border}`,
                              background: colors.background,
                              color: colors.text,
                              fontSize: '14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${colors.primary}10`
                              e.currentTarget.style.borderColor = colors.primary
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.background
                              e.currentTarget.style.borderColor = colors.border
                            }}
                          >
                            Share
                          </button>
                        </div>

                        {/* Cuisine chip */}
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: `${colors.scan}20`,
                            color: colors.scan,
                            textTransform: 'capitalize',
                          }}>
                            {selectedCuisine}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: `${colors.border}40`,
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            width: `${matchPercentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px',
                          color: colors.text,
                          opacity: 0.7
                        }}>
                          <span style={{ fontSize: '13px' }}>
                            {recipe.matched_count} of {recipe.total_count} ingredients in your fridge
                          </span>
                          {recipe.estimatedCost && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 700,
                              backgroundColor: `${colors.success}15`,
                              color: colors.success,
                              border: `1px solid ${colors.success}30`,
                            }}>
                              💰 ~HK${recipe.estimatedCost.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === 'shopping-list' && (
            <div>
              {shoppingList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: colors.text,
                  opacity: 0.7
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                  <div style={{ fontSize: '18px', fontWeight: 500 }}>
                    Your shopping list is empty
                  </div>
                </div>
              ) : (
                <div>
                  {/* Total cost bar */}
                  {(() => {
                    const unpurchased = shoppingList.filter(i => !i.is_purchased)
                    const totalCost = unpurchased.reduce(
                      (sum, i) => sum + (i.estimated_unit_cost ?? 0) * i.quantity, 0
                    )
                    return (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: colors.surface,
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: `1px solid ${colors.border}`,
                      }}>
                        <div>
                          <div style={{ fontSize: '12px', color: colors.text, opacity: 0.6 }}>Total estimate</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>
                            HK${totalCost.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                          {unpurchased.length} item{unpurchased.length !== 1 ? 's' : ''} remaining
                        </div>
                      </div>
                    )
                  })()}

                  {/* Clear purchased button */}
                  {shoppingList.some(i => i.is_purchased) && (
                    <button
                      onClick={handleClearPurchased}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '16px',
                        border: `1px solid ${colors.danger}40`,
                        borderRadius: '10px',
                        backgroundColor: `${colors.danger}08`,
                        color: colors.danger,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      🗑 Clear purchased items
                    </button>
                  )}

                  {/* Grouped list */}
                  {(() => {
                    const groups: Record<string, ShoppingListItem[]> = {}
                    for (const item of shoppingList) {
                      const key = item.recipe_name || 'Other'
                      if (!groups[key]) groups[key] = []
                      groups[key].push(item)
                    }
                    return Object.entries(groups).map(([recipeName, groupItems]) => (
                      <div key={recipeName} style={{ marginBottom: '24px' }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: colors.text,
                          opacity: 0.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '8px',
                          paddingBottom: '6px',
                          borderBottom: `1px solid ${colors.border}`,
                        }}>
                          {recipeName}
                        </div>
                        {groupItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: '16px',
                              marginBottom: '12px',
                              backgroundColor: item.is_purchased ? `${colors.border}20` : colors.background,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              opacity: item.is_purchased ? 0.6 : 1,
                              textDecoration: item.is_purchased ? 'line-through' : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: 500, color: colors.text, marginBottom: '4px' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                                {item.quantity} {item.unit}
                                {item.estimated_unit_cost && ` • HK$${item.estimated_unit_cost.toFixed(2)}`}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                await updateShoppingListItem(item.id, !item.is_purchased)
                                const list = await getShoppingList()
                                setShoppingList(list)
                              }}
                              style={{
                                padding: '8px 16px',
                                border: `1px solid ${item.is_purchased ? colors.success : colors.border}`,
                                background: item.is_purchased ? colors.success : colors.background,
                                color: item.is_purchased ? '#FFFFFF' : colors.text,
                                fontSize: '14px',
                                fontWeight: 500,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {item.is_purchased ? '✓' : 'Mark'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  )
}

