import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface ScanPromptPopupProps {
  onScan: () => void
  onEmpty: () => void
  onClose: () => void
}

export default function ScanPromptPopup({ onScan, onEmpty, onClose }: ScanPromptPopupProps) {
  const { colors } = useTheme()
  const [showContent, setShowContent] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [showButtons, setShowButtons] = useState(false)

  useEffect(() => {
    // Delay content appearance
    const timer1 = setTimeout(() => setShowContent(true), 300)
    
    // Typewriter effect for main message
    const message = "Let's scan your fridge to get started!"
    let currentIndex = 0
    
    const typeTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < message.length) {
          setTypedText(message.substring(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(interval)
          // Show buttons after typing completes
          setTimeout(() => setShowButtons(true), 500)
        }
      }, 50)
      
      return () => clearInterval(interval)
    }, 600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(typeTimer)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Vibrant Background Circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: `radial-gradient(circle, ${colors.primary}25 0%, ${colors.primary}10 50%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '350px',
        height: '350px',
        background: `radial-gradient(circle, ${colors.scan}25 0%, ${colors.scan}10 50%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'float 10s ease-in-out infinite',
        animationDelay: '1s',
        zIndex: 0
      }} />

      {/* Popup Content */}
      <div style={{
        position: 'relative',
        backgroundColor: colors.background,
        borderRadius: '24px',
        padding: '32px 24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        zIndex: 1,
        animation: showContent ? 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        transform: showContent ? 'scale(1)' : 'scale(0.9)',
        opacity: showContent ? 1 : 0
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close scan prompt"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            color: colors.text,
            fontSize: '20px',
            fontWeight: 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.6
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.backgroundColor = `${colors.text}10`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ×
        </button>

        {/* Icon/Emoji */}
        <div style={{
          fontSize: '64px',
          textAlign: 'center',
          marginBottom: '24px',
          animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          animationDelay: '0.3s',
          animationFillMode: 'both'
        }}>
          📸
        </div>

        {/* Title */}
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          color: colors.text,
          textAlign: 'center',
          marginBottom: '16px',
          lineHeight: '1.3',
          animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          animationFillMode: 'both'
        }}>
          Ready to Start?
        </div>

        {/* Typed Message */}
        <div style={{
          fontSize: '17px',
          fontWeight: 500,
          color: colors.text,
          textAlign: 'center',
          marginBottom: '32px',
          minHeight: '24px',
          lineHeight: '1.5',
          opacity: 0.8
        }}>
          {typedText}
          {typedText.length > 0 && typedText.length < "Let's scan your fridge to get started!".length && (
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '18px',
              backgroundColor: colors.primary,
              marginLeft: '2px',
              animation: 'blink 1s infinite',
              verticalAlign: 'middle'
            }} />
          )}
        </div>

        {/* Buttons */}
        {showButtons && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            animationFillMode: 'both'
          }}>
            <button
              onClick={onScan}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 6px 20px ${colors.scan}50`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.scan}40`
              }}
            >
              📷 Scan My Fridge
            </button>
            
            <button
              onClick={onEmpty}
              style={{
                width: '100%',
                padding: '18px',
                border: `2px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '17px',
                fontWeight: 600,
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.backgroundColor = `${colors.primary}10`
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.backgroundColor = colors.background
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              My Fridge is Empty
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
      `}</style>
    </div>
  )
}

