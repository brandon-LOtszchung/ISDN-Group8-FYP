import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName } from '@/translations'
import { InterfaceLanguage } from '@/types'
import { Languages, Home, ChefHat, ShoppingBag, ArrowLeft } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  showNav?: boolean
  showBack?: boolean
  title?: string
}

export default function Layout({ children, showNav = true, showBack = false, title }: LayoutProps) {
  const { language, setLanguage } = useLanguage()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const languages: InterfaceLanguage[] = ['en', 'zh-HK', 'fil', 'id']
  
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col h-screen">
        {/* Top Nav Bar */}
        <div className="bg-white border-b border-warm-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-warm-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-warm-600" strokeWidth={2} />
              </button>
            )}
            <h1 className="font-bold text-warm-900" style={{ fontSize: '17px', lineHeight: '1.3' }}>
              {title || 'Smart Fridge'}
            </h1>
          </div>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warm-200 hover:border-warm-300 transition-all bg-white"
            >
              <Languages className="w-4 h-4 text-warm-600" strokeWidth={2} />
              <span className="text-warm-700 font-medium" style={{ fontSize: '13px' }}>
                {language.toUpperCase()}
              </span>
            </button>
            
            {showLangMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-warm-200 overflow-hidden z-50 min-w-[160px]">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang)
                        setShowLangMenu(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-all ${
                        language === lang
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'hover:bg-warm-50 text-warm-700'
                      }`}
                      style={{ fontSize: '14px' }}
                    >
                      {getLanguageName(lang)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Bottom Navigation */}
        {showNav && (
          <div className="bg-white border-t border-warm-200 flex-shrink-0 safe-area-bottom">
            <div className="flex items-center">
              <Link to="/" className="flex-1">
                <button
                  className={`w-full flex flex-col items-center py-3 transition-all ${
                    isActive('/') 
                      ? 'text-primary-600' 
                      : 'text-warm-500 active:scale-95'
                  }`}
                >
                  <Home className={`w-6 h-6 mb-1 ${isActive('/') ? 'fill-primary-600' : ''}`} strokeWidth={2} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Home</span>
                </button>
              </Link>
              
              <Link to="/recipes" className="flex-1">
                <button
                  className={`w-full flex flex-col items-center py-3 transition-all ${
                    isActive('/recipes') || location.pathname.startsWith('/recipes/')
                      ? 'text-primary-600' 
                      : 'text-warm-500 active:scale-95'
                  }`}
                >
                  <ChefHat className="w-6 h-6 mb-1" strokeWidth={2} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Recipes</span>
                </button>
              </Link>
              
              <Link to="/shopping-list" className="flex-1">
                <button
                  className={`w-full flex flex-col items-center py-3 transition-all ${
                    isActive('/shopping-list') 
                      ? 'text-primary-600' 
                      : 'text-warm-500 active:scale-95'
                  }`}
                >
                  <ShoppingBag className="w-6 h-6 mb-1" strokeWidth={2} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Shopping</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
