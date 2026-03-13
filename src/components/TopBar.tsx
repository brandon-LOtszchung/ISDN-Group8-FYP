import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApp } from '@/contexts/AppContext'
import { InterfaceLanguage } from '@/types'
import { getLanguageName } from '@/translations'

export default function TopBar() {
  const { theme, setTheme, colors } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { state } = useApp()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderColor: colors.border,
        height: '64px',
        padding: '0 20px',
        backgroundColor: colors.background,
      }}
    >
      <div className="flex items-center justify-between h-full">
        {/* Left: App Name */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            maxWidth: 'calc(100vw - 120px)',
            flexShrink: 1,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '4px',
              height: '4px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: colors.primary,
              letterSpacing: '0.3px',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Your Cooking Partner
          </span>
        </div>

        {/* Right: Theme Toggle + Avatar */}
        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Theme Toggle — single icon button */}
          <button
            onClick={() => setTheme(theme === 'warm' ? 'cool' : 'warm')}
            aria-label={
              theme === 'warm' ? 'Switch to cool theme' : 'Switch to warm theme'
            }
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: `1.5px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.primary}15`
              e.currentTarget.style.borderColor = colors.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface
              e.currentTarget.style.borderColor = colors.border
            }}
          >
            {theme === 'warm' ? '☀️' : '❄️'}
          </button>

          {/* User Avatar — opens profile drawer */}
          <button
            onClick={() => setShowProfile(true)}
            aria-label="Open profile and settings"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${colors.primary}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}60`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary}40`
            }}
          >
            {state?.family?.name?.[0]?.toUpperCase() ?? '👤'}
          </button>
        </div>
      </div>

      {/* Profile Drawer */}
      {showProfile && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowProfile(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease',
            }}
          />
          {/* Sheet */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderRadius: '20px 20px 0 0',
              zIndex: 201,
              padding: '0 0 32px',
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* Drag handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: colors.border,
                borderRadius: '2px',
                margin: '12px auto 20px',
              }}
            />

            {/* Family name heading */}
            <div
              style={{
                padding: '0 20px 16px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                {state?.family?.name || 'Your Family'}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: colors.text,
                  opacity: 0.6,
                  marginTop: '4px',
                }}
              >
                {state?.family?.members?.length ?? 0} member
                {(state?.family?.members?.length ?? 0) !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Family members list */}
            {(state?.family?.members?.length ?? 0) > 0 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    opacity: 0.5,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Members
                </div>
                {state!.family!.members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 0',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.primary}60, ${colors.scan}60)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: colors.primary,
                      }}
                    >
                      {member.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: colors.text,
                        }}
                      >
                        {member.name}
                      </div>
                      {member.age > 0 && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: colors.text,
                            opacity: 0.5,
                          }}
                        >
                          Age {member.age}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Language selector */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  opacity: 0.5,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Language
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['en', 'zh-HK', 'fil', 'id'] as InterfaceLanguage[]).map(
                  (lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1.5px solid ${language === lang ? colors.primary : colors.border}`,
                        background:
                          language === lang
                            ? `${colors.primary}15`
                            : 'transparent',
                        color: language === lang ? colors.primary : colors.text,
                        fontSize: '14px',
                        fontWeight: language === lang ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {getLanguageName(lang)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Close button */}
            <div style={{ padding: '20px 20px 0' }}>
              <button
                onClick={() => setShowProfile(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
