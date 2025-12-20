import { useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { initializeInventory } from '@/services/inventoryApi'

interface CameraUploadProps {
  onClose: () => void
}

export default function CameraUpload({ onClose }: CameraUploadProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { setLoading, setError, initializeFridge, setInventory } = useApp()
  const [images, setImages] = useState<File[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const newImages = [...images, ...files].slice(0, 3)
      setImages(newImages)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDetect = async () => {
    if (images.length === 0) return

    try {
      setIsDetecting(true)
      setLoading(true)
      
      // Typing effect for processing messages (5 seconds total simulation)
      const messages = [
        'Uploading images...',
        'Analyzing your fridge contents...',
        'Detecting items with AI...',
        'Processing!'
      ]
      
      let currentMessageIndex = 0
      let currentCharIndex = 0
      let typedText = ''
      
      const typeMessage = () => {
        if (currentMessageIndex >= messages.length) {
          // All messages typed, proceed with API call
          return
        }
        
        const currentMessage = messages[currentMessageIndex]
        if (currentCharIndex < currentMessage.length) {
          typedText = currentMessage.substring(0, currentCharIndex + 1)
          setProcessingMessage(typedText)
          currentCharIndex++
          setTimeout(typeMessage, 50) // 50ms per character for typing effect
        } else {
          // Message complete, wait then move to next
          currentMessageIndex++
          currentCharIndex = 0
          if (currentMessageIndex < messages.length) {
            setTimeout(() => {
              typedText = ''
              setProcessingMessage('')
              setTimeout(typeMessage, 200) // Brief pause between messages
            }, 800) // Show completed message for 800ms
          } else {
            // All messages typed, start API call
            setTimeout(async () => {
              const detectedItems = await initializeInventory(images)
              setIsDetecting(false)
              setIsProcessing(true)
              setProcessingMessage('Processing!')
              
              // Add detected items to inventory with animation delay
              await new Promise(resolve => setTimeout(resolve, 800))
              setInventory(detectedItems)
              
              initializeFridge()
              
              // Show success message before closing
              await new Promise(resolve => setTimeout(resolve, 1200))
              onClose()
            }, 500)
          }
        }
      }
      
      // Start typing effect
      typeMessage()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to detect items')
      setIsDetecting(false)
      setIsProcessing(false)
      setLoading(false)
    }
  }

  return (
    <>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: colors.background,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '64px',
        animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {/* Vibrant Background */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${colors.scan}25 0%, ${colors.scan}12 50%, transparent 70%)`,
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
          background: `radial-gradient(circle, ${colors.primary}25 0%, ${colors.primary}12 50%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 12s ease-in-out infinite',
          animationDelay: '1s',
          zIndex: 0
        }} />

        <div style={{ 
          padding: '24px', 
          flex: 1, 
          overflow: 'auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            background: `linear-gradient(135deg, ${colors.scan}, ${colors.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {t('takePhotos')}
          </div>
          <div style={{
            fontSize: '16px',
            color: colors.text,
            opacity: 0.7,
            marginBottom: '24px',
            animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            animationFillMode: 'both'
          }}>
            Take photos or upload from your gallery
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1',
                  border: `2px dashed ${images[index] ? colors.primary : colors.border}`,
                  backgroundColor: images[index] ? `${colors.primary}10` : colors.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  animation: images[index] ? 'scaleIn 0.3s ease' : 'none',
                  overflow: 'hidden',
                }}
              >
                {images[index] ? (
                  <>
                    <img
                      src={URL.createObjectURL(images[index])}
                      alt={`Photo ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        backgroundColor: colors.danger,
                        color: '#FFFFFF',
                        fontSize: '18px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        boxShadow: `0 2px 4px ${colors.danger}40`,
                        cursor: 'pointer',
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
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: colors.text,
                      fontSize: '32px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.scan
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.backgroundColor = `${colors.scan}08`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.text
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '40px', lineHeight: '1' }}>+</span>
                    <span style={{ 
                      fontSize: '10px', 
                      opacity: 0.6,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Add
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {(isDetecting || isProcessing) && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: colors.text,
              animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}>
              {/* Animated background circles */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${colors.scan}20 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'pulseCircle 2s ease-in-out infinite',
                zIndex: 0
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'pulseCircle 2s ease-in-out infinite',
                animationDelay: '0.5s',
                zIndex: 0
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '32px',
                  animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>
                  {isProcessing ? '✨' : '🔍'}
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 700,
                  marginBottom: '8px',
                  background: `linear-gradient(135deg, ${colors.scan}, ${colors.primary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  minHeight: '32px',
                  lineHeight: '1.3'
                }}>
                  {processingMessage || t('detecting')}
                  {processingMessage && processingMessage.length > 0 && processingMessage !== 'Processing!' && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '24px',
                      backgroundColor: colors.scan,
                      marginLeft: '4px',
                      animation: 'blink 1s infinite',
                      verticalAlign: 'middle'
                    }} />
                  )}
                </div>
                <div style={{
                  fontSize: '15px',
                  color: colors.text,
                  opacity: 0.7,
                  marginBottom: '32px',
                  fontWeight: 500
                }}>
                  {isProcessing ? 'Almost done!' : 'This will take a few seconds...'}
                </div>
                <div style={{
                  width: '240px',
                  height: '8px',
                  background: `${colors.border}40`,
                  margin: '0 auto',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: `inset 0 2px 4px ${colors.border}20`
                }}>
                  <div style={{
                    width: isProcessing ? '100%' : '60%',
                    height: '100%',
                    background: `linear-gradient(90deg, ${colors.scan}, ${colors.primary}, ${colors.scan})`,
                    backgroundSize: '200% 100%',
                    borderRadius: '4px',
                    animation: isProcessing ? 'loadingGradient 2s ease infinite' : 'loading 1.5s ease infinite',
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {!(isDetecting || isProcessing) && (
          <div style={{ 
            padding: '20px', 
            borderTop: `1px solid ${colors.border}40`,
            display: 'flex',
            gap: '12px',
            backgroundColor: colors.background,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '16px',
                border: `2px solid ${colors.border}`,
                backgroundColor: colors.background,
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
              {t('back')}
            </button>
            <button
              onClick={handleDetect}
              disabled={images.length === 0}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                background: images.length === 0 
                  ? colors.border 
                  : `linear-gradient(135deg, ${colors.scan}, ${colors.scan}dd)`,
                color: '#FFFFFF',
                fontSize: '17px',
                fontWeight: 600,
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: images.length === 0 ? 0.5 : 1,
                cursor: images.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: images.length > 0 ? `0 4px 16px ${colors.scan}40` : 'none',
              }}
              onMouseEnter={(e) => {
                if (images.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.scan}50`
                }
              }}
              onMouseLeave={(e) => {
                if (images.length > 0) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${colors.scan}40`
                }
              }}
            >
              {t('detect')}
            </button>
          </div>
        )}
      </div>

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
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes loadingGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseCircle {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
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
    </>
  )
}
