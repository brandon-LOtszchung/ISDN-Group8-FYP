import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { InterfaceLanguage } from '@/types'
import { getLanguageName } from '@/translations'

export default function TopBar() {
  const { theme, setTheme, colors } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  const languages: InterfaceLanguage[] = ['en', 'zh-HK', 'fil', 'id']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b"
      style={{ 
        borderColor: colors.border,
        height: '64px',
        padding: '0 20px'
      }}
    >
      <div className="flex items-center justify-between h-full">
        {/* Left: App Name - Compact Mobile-Optimized Logo */}
        <div 
          style={{ 
            fontSize: '15px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.3px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            lineHeight: '1.2',
            maxWidth: 'calc(100vw - 120px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
            borderRadius: '50%',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Your Cooking Partner
          </span>
        </div>

        {/* Right: Theme Switcher + Language - Apple-style proportions */}
        <div className="flex items-center" style={{ gap: '12px' as const }}>
          {/* Theme Switcher - Proportional squares */}
          <div className="flex items-center" style={{ gap: '6px' as const }}>
            <button
              onClick={() => setTheme('warm')}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#FF6B35',
                border: theme === 'warm' ? `2.5px solid ${colors.text}` : '2px solid transparent',
                opacity: theme === 'warm' ? 1 : 0.6,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = theme === 'warm' ? '1' : '0.6'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label="Warm theme"
            />
            <button
              onClick={() => setTheme('cool')}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#16A085',
                border: theme === 'cool' ? `2.5px solid ${colors.text}` : '2px solid transparent',
                opacity: theme === 'cool' ? 1 : 0.6,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = theme === 'cool' ? '1' : '0.6'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label="Cool theme"
            />
          </div>

          {/* Language Dropdown - Proportional sizing */}
          <div ref={langDropdownRef} className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: colors.text,
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.text}08`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {getLanguageName(language)}
              <span style={{
                fontSize: '12px',
                opacity: 0.6,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: showLangDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block'
              }}>▼</span>
            </button>

            {showLangDropdown && (
              <div
                className="absolute top-full right-0 mt-2 bg-white border shadow-lg"
                style={{
                  borderColor: colors.border,
                  borderRadius: '12px',
                  minWidth: '140px',
                  padding: '8px 0',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 1000
                }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                      setShowLangDropdown(false)
                    }}
                    className="w-full text-left transition-colors"
                    style={{
                      fontSize: '15px',
                      fontWeight: language === lang ? 600 : 500,
                      color: language === lang ? colors.primary : colors.text,
                      backgroundColor: language === lang ? `${colors.primary}10` : 'transparent',
                      padding: '10px 16px',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onMouseEnter={(e) => {
                      if (language !== lang) {
                        e.currentTarget.style.backgroundColor = `${colors.text}05`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (language !== lang) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {getLanguageName(lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

