import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { InventoryItem, ItemCategory } from '@/types'
import TopBar from '@/components/TopBar'
import CameraUpload from '@/components/CameraUpload'
import ScanPromptPopup from '@/components/ScanPromptPopup'
import PlanningPage from './PlanningPage'

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: '#4CAF50',
  fruits:     '#FF9800',
  meat:       '#F44336',
  seafood:    '#2196F3',
  dairy:      '#03A9F4',
  grains:     '#9C27B0',
  condiments: '#FF5722',
  beverages:  '#00BCD4',
  snacks:     '#E91E63',
  frozen:     '#3F51B5',
  canned:     '#795548',
  other:      '#9E9E9E',
}

export default function InventoryPage() {
  const { state, removeInventoryItem, updateInventoryItem, initializeFridge } = useApp()
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [showCamera, setShowCamera] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'planning'>('inventory')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ItemCategory>>(new Set())
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set())
  const [swipedItem, setSwipedItem] = useState<string | null>(null)
  const swipeStartX = useRef<number>(0)
  const swipeStartY = useRef<number>(0)

  // Show popup only if inventory is empty (new user) and fridge not initialized
  useEffect(() => {
    if (!state.fridgeInitialized && state.onboardingCompleted && state.inventory.length === 0) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowPopup(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [state.fridgeInitialized, state.onboardingCompleted, state.inventory.length])

  const handleEmptyFridge = () => {
    initializeFridge()
    setShowPopup(false)
  }

  const groupedInventory = state.inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<ItemCategory, InventoryItem[]>)

  const handleTouchStart = (e: React.TouchEvent, _itemId: string) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent, itemId: string) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current)
    if (dx < -60 && dy < 30) {
      setSwipedItem(itemId)
    } else if (dx > 20) {
      setSwipedItem(null)
    }
  }

  const toggleCategory = (category: ItemCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleAddQuantity = (item: InventoryItem) => {
    setAnimatingItems(prev => new Set(prev).add(item.id))
    updateInventoryItem(item.id, item.quantity + 1)
    setTimeout(() => setAnimatingItems(prev => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    }), 300)
  }

  const handleRemoveQuantity = (item: InventoryItem) => {
    if (item.quantity > 1) {
      setAnimatingItems(prev => new Set(prev).add(item.id))
      updateInventoryItem(item.id, item.quantity - 1)
      setTimeout(() => setAnimatingItems(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      }), 300)
    } else {
      setAnimatingItems(prev => new Set(prev).add(item.id))
      setTimeout(() => {
        removeInventoryItem(item.id)
        setAnimatingItems(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, 200)
    }
  }

  if (showCamera) {
    return <CameraUpload onClose={() => setShowCamera(false)} />
  }

  return (
    <>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: colors.background, 
        paddingTop: '64px', 
        paddingBottom: '80px',
        transition: 'background-color 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Vibrant Background */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${colors.primary}15 0%, ${colors.primary}08 50%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 12s ease-in-out infinite',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '350px',
          height: '350px',
          background: `radial-gradient(circle, ${colors.scan}15 0%, ${colors.scan}08 50%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 14s ease-in-out infinite',
          animationDelay: '1s',
          zIndex: 0
        }} />

        <TopBar />
        
        <div style={{ 
          padding: '20px', 
          paddingBottom: '100px',
          position: 'relative',
          zIndex: 1
        }}>
          {activeTab === 'inventory' && (
            <>
              {state.inventory.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: colors.text,
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '24px',
                animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                animationDelay: '0.2s',
                animationFillMode: 'both'
              }}>
                🍽️
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600,
                marginBottom: '12px',
                color: colors.text,
                opacity: 0.9
              }}>
                {t('noItems')}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: colors.text,
                opacity: 0.7,
                lineHeight: '1.5',
                marginBottom: '32px'
              }}>
                Tap the scan button below to add items
              </div>
              
              {/* Scan Button inside Inventory Tab */}
              <button
                onClick={() => setShowCamera(true)}
                style={{
                  width: '100%',
                  padding: '18px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.scan}, ${colors.scan}dd)`,
                  color: '#FFFFFF',
                  fontSize: '17px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: `0 4px 16px ${colors.scan}40`,
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  animationFillMode: 'both'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.scan}50`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${colors.scan}40`
                }}
              >
                Scan items
              </button>
            </div>
          ) : (
            <div>
              {Object.entries(groupedInventory).map(([category, items], categoryIndex) => (
                <div 
                  key={category} 
                  style={{ 
                    marginBottom: '8px',
                    animation: `slideIn 0.3s ease ${categoryIndex * 0.05}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <button
                    onClick={() => toggleCategory(category as ItemCategory)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.border}`,
                      borderLeft: `4px solid ${CATEGORY_COLORS[category] ?? colors.border}`,
                      backgroundColor: `${CATEGORY_COLORS[category] ?? colors.border}08`,
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: 600,
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}10`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${CATEGORY_COLORS[category] ?? colors.border}08`
                    }}
                  >
                    <span>{t(category)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: CATEGORY_COLORS[category] ?? colors.text,
                        backgroundColor: `${CATEGORY_COLORS[category] ?? colors.border}20`,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        flexShrink: 0,
                      }}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                      <span
                        aria-label={collapsedCategories.has(category as ItemCategory)
                          ? `Expand ${t(category)}`
                          : `Collapse ${t(category)}`}
                        style={{
                          fontSize: '12px',
                          color: colors.text,
                          opacity: 0.6,
                          transition: 'transform 0.2s ease',
                          transform: collapsedCategories.has(category as ItemCategory) ? 'rotate(0deg)' : 'rotate(180deg)',
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </button>
                  {!collapsedCategories.has(category as ItemCategory) && (
                    <div style={{ 
                      border: `1px solid ${colors.border}`, 
                      borderTop: 'none',
                      animation: 'slideDown 0.2s ease'
                    }}>
                      {items.map((item) => (
                        <div key={item.id} style={{ position: 'relative', overflow: 'hidden' }}>
                          {/* Red delete area — behind the row */}
                          <div style={{
                            position: 'absolute',
                            right: 0, top: 0, bottom: 0,
                            width: '80px',
                            backgroundColor: colors.danger,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>
                            Delete
                          </div>

                          {/* Tap target over revealed delete area */}
                          {swipedItem === item.id && (
                            <div
                              aria-label={`Delete ${item.name}`}
                              role="button"
                              tabIndex={0}
                              style={{
                                position: 'absolute',
                                right: 0, top: 0, bottom: 0,
                                width: '80px',
                                cursor: 'pointer',
                                zIndex: 2,
                              }}
                              onClick={() => {
                                removeInventoryItem(item.id)
                                setSwipedItem(null)
                              }}
                            />
                          )}

                          <div
                            onTouchStart={(e) => handleTouchStart(e, item.id)}
                            onTouchEnd={(e) => handleTouchEnd(e, item.id)}
                            onClick={() => { if (swipedItem === item.id) setSwipedItem(null) }}
                            style={{
                              padding: '10px 12px',
                              borderBottom: `1px solid ${colors.border}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s ease',
                              backgroundColor: animatingItems.has(item.id) ? `${colors.primary}10` : 'transparent',
                              animation: animatingItems.has(item.id) ? 'pulse 0.3s ease' : 'none',
                              transform: swipedItem === item.id ? 'translateX(-80px)' : 'translateX(0)',
                              position: 'relative',
                              zIndex: 1,
                            }}
                          >
                          <div style={{ flex: 1, fontSize: '14px', color: colors.text }}>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            <span style={{ 
                              fontSize: '12px', 
                              opacity: 0.6, 
                              marginLeft: '8px',
                              transition: 'all 0.2s ease',
                              display: 'inline-block',
                              transform: animatingItems.has(item.id) ? 'scale(1.2)' : 'scale(1)'
                            }}>
                              x{item.quantity}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleAddQuantity(item)}
                              aria-label={`Increase quantity of ${item.name}`}
                              style={{
                                width: '44px',
                                height: '44px',
                                border: 'none',
                                backgroundColor: colors.success,
                                color: '#FFFFFF',
                                fontSize: '18px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                boxShadow: `0 2px 4px ${colors.success}40`,
                              }}
                              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 4px 8px ${colors.success}60`
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = `0 2px 4px ${colors.success}40`
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveQuantity(item)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              style={{
                                width: '44px',
                                height: '44px',
                                border: 'none',
                                backgroundColor: colors.danger,
                                color: '#FFFFFF',
                                fontSize: '18px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                boxShadow: `0 2px 4px ${colors.danger}40`,
                              }}
                              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 4px 8px ${colors.danger}60`
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = `0 2px 4px ${colors.danger}40`
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              −
                            </button>
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Scan Button inside Inventory Tab (when items exist) */}
              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={() => setShowCamera(true)}
                  style={{
                    width: '100%',
                    padding: '18px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${colors.scan}, ${colors.scan}dd)`,
                    color: '#FFFFFF',
                    fontSize: '17px',
                    fontWeight: 600,
                    borderRadius: '16px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: `0 4px 16px ${colors.scan}40`,
                    cursor: 'pointer'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.scan}50`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 4px 16px ${colors.scan}40`
                  }}
                >
                  Scan items
                </button>
              </div>
            </div>
          )}
            </>
          )}

          {activeTab === 'planning' && (
            <PlanningPage />
          )}
        </div>

        {/* Bottom Tab Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTop: `1px solid ${colors.border}40`,
          display: 'flex',
          zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'inventory' ? colors.primary : colors.text,
              fontSize: '15px',
              fontWeight: activeTab === 'inventory' ? 600 : 500,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              position: 'relative',
              opacity: activeTab === 'inventory' ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'inventory') {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.backgroundColor = `${colors.text}05`
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'inventory') {
                e.currentTarget.style.opacity = '0.7'
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: activeTab === 'inventory' 
                ? `linear-gradient(90deg, ${colors.primary}, ${colors.scan})`
                : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'planning' ? colors.primary : colors.text,
              fontSize: '15px',
              fontWeight: activeTab === 'planning' ? 600 : 500,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              position: 'relative',
              opacity: activeTab === 'planning' ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'planning') {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.backgroundColor = `${colors.text}05`
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'planning') {
                e.currentTarget.style.opacity = '0.7'
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: activeTab === 'planning' 
                ? `linear-gradient(90deg, ${colors.primary}, ${colors.scan})`
                : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
            Planning
          </button>
        </div>
      </div>

      {/* Scan Prompt Popup */}
      {showPopup && (
        <ScanPromptPopup
          onScan={() => {
            setShowPopup(false)
            setTimeout(() => setShowCamera(true), 400)
          }}
          onEmpty={handleEmptyFridge}
          onClose={() => setShowPopup(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 500px; opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
      `}</style>
    </>
  )
}
