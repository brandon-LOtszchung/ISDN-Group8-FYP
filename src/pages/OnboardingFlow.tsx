import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Family, FamilyMember } from '@/types'
import { updateFamily } from '@/services/supabase'
import { DIETARY_RESTRICTIONS, ALLERGY_OPTIONS } from '@/constants'
import TopBar from '@/components/TopBar'

type Step = 'name' | 'cooking-intro' | 'cooking' | 'cooking-feedback' | 'budget' | 'budget-feedback' | 'members' | 'summary'

const COOKING_OPTIONS = [
  { key: 'rarely', value: 'beginner', label: 'Rarely', description: 'A few times a month', feedback: "Perfect!\n\nYou're exactly who we designed this for!\n\nJoin 50,000+ beginner cooks discovering amazing simple recipes every week.\n\nWe're here to make your cooking journey effortless and delightful!" },
  { key: 'sometimes', value: 'beginner', label: 'Sometimes', description: 'A few times a week', feedback: "Perfect!\n\nYou're our ideal user!\n\nExplore 15,000+ quick and easy recipes loved by 80,000+ families just like yours.\n\nYou're going to love what we have for you!" },
  { key: 'regularly', value: 'intermediate', label: 'Regularly', description: 'Almost every day', feedback: "Perfect!\n\nYou're an amazing cook and exactly who inspires our community!\n\nJoin 100,000+ passionate cooks sharing 25,000+ incredible recipes.\n\nYour experience makes you perfect for this!" },
  { key: 'daily', value: 'advanced', label: 'Daily', description: 'Every single day', feedback: "Perfect!\n\nYou're a true cooking master and the heart of our community!\n\nJoin 150,000+ cooking pros creating unforgettable meals from 30,000+ recipes.\n\nYou're the perfect fit!" },
]

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget-Friendly', amount: 'Under HK$100', feedback: 'Perfect Choice!\n\nYou\'re joining 60,000+ smart shoppers who love our budget-friendly recipes.\n\nSave money while enjoying amazing meals from 18,000+ wallet-friendly options!' },
  { value: 'medium', label: 'Moderate', amount: 'HK$100-200', feedback: 'Perfect Balance!\n\nYou\'re exactly like 70,000+ families who love quality ingredients.\n\nExplore 20,000+ balanced recipes with perfect value - just right for you!' },
  { value: 'high', label: 'Premium', amount: 'Above HK$200', feedback: 'Perfect!\n\nYou\'re joining 40,000+ food enthusiasts who love premium experiences.\n\nDiscover 15,000+ gourmet recipes crafted just for perfectionists like you!' },
]

export default function OnboardingFlow() {
  const { state, setFamily, completeOnboarding } = useApp()
  const { colors } = useTheme()
  const { t, language } = useLanguage()
  const [currentStep, setCurrentStep] = useState<Step>('name')

  const STEP_ORDER: Step[] = [
    'name', 'cooking-intro', 'cooking', 'cooking-feedback',
    'budget', 'budget-feedback', 'members', 'summary',
  ]
  const currentStepNumber = STEP_ORDER.indexOf(currentStep) + 1
  const totalSteps = STEP_ORDER.length
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0)
  const [editingFamily, setEditingFamily] = useState<Family | null>(state.family)
  const [editingMembers, setEditingMembers] = useState<FamilyMember[]>(state.family?.members || [])
  const [familyName, setFamilyName] = useState('')
  const [selectedCooking, setSelectedCooking] = useState<string>('')
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [typedText2, setTypedText2] = useState('')
  const [typedText3, setTypedText3] = useState('')
  const [showMainText, setShowMainText] = useState(false)
  const [inputPlaceholderText, setInputPlaceholderText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const placeholderTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const [cookingIntroText1, setCookingIntroText1] = useState('')
  const [cookingIntroText2, setCookingIntroText2] = useState('')
  const [cookingIntroText3, setCookingIntroText3] = useState('')
  const allIntervalsRef = useRef<{ intervals: NodeJS.Timeout[], timeouts: NodeJS.Timeout[] }>({ intervals: [], timeouts: [] })
  const [feedbackTypedLines, setFeedbackTypedLines] = useState<string[]>([])
  const [feedbackCurrentLineIndex, setFeedbackCurrentLineIndex] = useState(0)
  const [feedbackTypedText, setFeedbackTypedText] = useState('')
  const feedbackTypingRef = useRef<{ intervals: NodeJS.Timeout[], timeouts: NodeJS.Timeout[] }>({ intervals: [], timeouts: [] })

  useEffect(() => {
    if (state.family) {
      setEditingFamily(state.family)
      // Initialize with empty members for demo - user will input manually
      setEditingMembers(state.family.members.map(() => ({
        id: '',
        name: '',
        age: 0,
        dietaryRestrictions: [],
        allergies: [],
        healthConditions: [],
        preferences: {
          spiceLevel: 'mild',
          favoriteCuisines: [],
          dislikedIngredients: []
        }
      })))
      // Don't set familyName from state - let user type fresh
      setSelectedCooking(state.family.preferences.cookingSkillLevel)
      setSelectedBudget(state.family.preferences.budgetRange)
    }
  }, [state.family])

  // Typewriter effect - Sequential order: 1, 2, 3, input, button
  useEffect(() => {
    // Clear all previous intervals and timeouts first
    allIntervalsRef.current.intervals.forEach(id => clearInterval(id))
    allIntervalsRef.current.timeouts.forEach(id => clearTimeout(id))
    allIntervalsRef.current = { intervals: [], timeouts: [] }
    if (placeholderTimeoutsRef.current) {
      placeholderTimeoutsRef.current.forEach(id => clearTimeout(id))
      placeholderTimeoutsRef.current = []
    }
    
    if (currentStep === 'name') {
      // Get translated text
      const praiseText1 = t('praiseText1')
      const praiseText2 = t('praiseText2')
      const praiseText3 = t('praiseText3')
      
      let currentIndex1 = 0
      let currentIndex2 = 0
      let currentIndex3 = 0
      
      setTypedText('')
      setTypedText2('')
      setTypedText3('')
      setInputPlaceholderText('')
      setShowMainText(false)
      setShowInput(false)
      
      // Sentence 1
      const typeInterval1 = setInterval(() => {
        if (currentIndex1 < praiseText1.length) {
          setTypedText(praiseText1.slice(0, currentIndex1 + 1))
          currentIndex1++
        } else {
          clearInterval(typeInterval1)
          allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== typeInterval1)
          const timeout1 = setTimeout(() => {
            // Sentence 2
            const typeInterval2 = setInterval(() => {
              if (currentIndex2 < praiseText2.length) {
                setTypedText2(praiseText2.slice(0, currentIndex2 + 1))
                currentIndex2++
              } else {
                clearInterval(typeInterval2)
                allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== typeInterval2)
                const timeout2 = setTimeout(() => {
                  // Sentence 3
                  setShowMainText(true)
                  const typeInterval3 = setInterval(() => {
                    if (currentIndex3 < praiseText3.length) {
                      setTypedText3(praiseText3.slice(0, currentIndex3 + 1))
                      currentIndex3++
                    } else {
                      clearInterval(typeInterval3)
                      allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== typeInterval3)
                      const timeout3 = setTimeout(() => {
                        // Show input and start cycling placeholder
                        setShowInput(true)
                        
                        // Get example names based on current language
                        const exampleNames = [
                          t('exampleFamily1'),
                          t('exampleFamily2')
                        ]
                        
                        let currentExample = 0
                        let currentChar = 0
                        let isDeleting = false
                        
                        // Capture ref in closure to avoid scope issues
                        const timeoutsRef = placeholderTimeoutsRef
                        let isStopped = false
                        
                        const typeExample = () => {
                          // Check if stopped or if user has typed
                          if (isStopped) return
                          
                          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
                          if (inputElement?.value?.trim()) {
                            setInputPlaceholderText('')
                            // Clear all timeouts
                            if (timeoutsRef.current) {
                              timeoutsRef.current.forEach(id => clearTimeout(id))
                              timeoutsRef.current = []
                            }
                            isStopped = true
                            return
                          }
                          
                          const currentText = exampleNames[currentExample]
                          
                          if (!isDeleting && currentChar < currentText.length) {
                            setInputPlaceholderText(currentText.slice(0, currentChar + 1))
                            currentChar++
                            const id = setTimeout(typeExample, 150)
                            if (timeoutsRef.current) {
                              timeoutsRef.current.push(id)
                            }
                          } else if (!isDeleting && currentChar === currentText.length) {
                            // Wait before deleting
                            const id = setTimeout(() => {
                              if (!isStopped && timeoutsRef.current) {
                                const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
                                if (!inputElement?.value?.trim()) {
                                  isDeleting = true
                                  typeExample()
                                }
                              }
                            }, 2000)
                            if (timeoutsRef.current) {
                              timeoutsRef.current.push(id)
                            }
                          } else if (isDeleting && currentChar > 0) {
                            setInputPlaceholderText(currentText.slice(0, currentChar - 1))
                            currentChar--
                            const id = setTimeout(typeExample, 80)
                            if (timeoutsRef.current) {
                              timeoutsRef.current.push(id)
                            }
                          } else if (isDeleting && currentChar === 0) {
                            // Cycle to next example (infinite loop)
                            isDeleting = false
                            currentExample = (currentExample + 1) % exampleNames.length
                            const id = setTimeout(typeExample, 300)
                            if (timeoutsRef.current) {
                              timeoutsRef.current.push(id)
                            }
                          }
                        }
                        
                        typeExample()
                      }, 600)
                      allIntervalsRef.current.timeouts.push(timeout3)
                    }
                  }, 60)
                  allIntervalsRef.current.intervals.push(typeInterval3)
                }, 800)
                allIntervalsRef.current.timeouts.push(timeout2)
              }
            }, 50)
            allIntervalsRef.current.intervals.push(typeInterval2)
          }, 1000)
          allIntervalsRef.current.timeouts.push(timeout1)
        }
      }, 80)
      allIntervalsRef.current.intervals.push(typeInterval1)

      return () => {
        allIntervalsRef.current.intervals.forEach(id => clearInterval(id))
        allIntervalsRef.current.timeouts.forEach(id => clearTimeout(id))
        allIntervalsRef.current = { intervals: [], timeouts: [] }
        if (placeholderTimeoutsRef.current) {
          placeholderTimeoutsRef.current.forEach(id => clearTimeout(id))
          placeholderTimeoutsRef.current = []
        }
      }
    } else {
      setTypedText('')
      setTypedText2('')
      setTypedText3('')
      setInputPlaceholderText('')
      setShowMainText(false)
      setShowInput(false)
    }
  }, [currentStep, t, language])
  
  // Typewriter effect for cooking intro page
  useEffect(() => {
    if (currentStep === 'cooking-intro') {
      // Clear previous animations
      allIntervalsRef.current.intervals.forEach(id => clearInterval(id))
      allIntervalsRef.current.timeouts.forEach(id => clearTimeout(id))
      allIntervalsRef.current = { intervals: [], timeouts: [] }
      
      const text1 = t('cookingIntroText1').replace('{0}', familyName.trim())
      const text2 = t('cookingIntroText2')
      const text3 = t('cookingIntroText3')
      
      let index1 = 0
      let index2 = 0
      let index3 = 0
      
      setCookingIntroText1('')
      setCookingIntroText2('')
      setCookingIntroText3('')
      
      // Text 1
      const interval1 = setInterval(() => {
        if (index1 < text1.length) {
          setCookingIntroText1(text1.slice(0, index1 + 1))
          index1++
        } else {
          clearInterval(interval1)
          allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== interval1)
          const timeout1 = setTimeout(() => {
            // Text 2
            const interval2 = setInterval(() => {
              if (index2 < text2.length) {
                setCookingIntroText2(text2.slice(0, index2 + 1))
                index2++
              } else {
                clearInterval(interval2)
                allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== interval2)
                const timeout2 = setTimeout(() => {
                  // Text 3
                  const interval3 = setInterval(() => {
                    if (index3 < text3.length) {
                      setCookingIntroText3(text3.slice(0, index3 + 1))
                      index3++
                    } else {
                      clearInterval(interval3)
                      allIntervalsRef.current.intervals = allIntervalsRef.current.intervals.filter(id => id !== interval3)
                      const timeout3 = setTimeout(() => {
                        // Auto-transition to next page with downward slide effect
                        setCurrentStep('cooking')
                      }, 1200)
                      allIntervalsRef.current.timeouts.push(timeout3)
                    }
                  }, 60)
                  allIntervalsRef.current.intervals.push(interval3)
                }, 600)
                allIntervalsRef.current.timeouts.push(timeout2)
              }
            }, 50)
            allIntervalsRef.current.intervals.push(interval2)
          }, 800)
          allIntervalsRef.current.timeouts.push(timeout1)
        }
      }, 80)
      allIntervalsRef.current.intervals.push(interval1)
      
      return () => {
        allIntervalsRef.current.intervals.forEach(id => clearInterval(id))
        allIntervalsRef.current.timeouts.forEach(id => clearTimeout(id))
        allIntervalsRef.current = { intervals: [], timeouts: [] }
      }
    } else {
      setCookingIntroText1('')
      setCookingIntroText2('')
      setCookingIntroText3('')
    }
  }, [currentStep, t, language, familyName])

  if (!editingFamily) {
    return <div>Loading...</div>
  }

  const handleFamilyUpdate = async (updates: Partial<Family>) => {
    const updated = { ...editingFamily, ...updates }
    setEditingFamily(updated)
    const saved = await updateFamily(updates)
    if (saved) {
      setFamily(saved)
    }
  }

  const handleMemberUpdate = (member: FamilyMember) => {
    // Just update local state, don't save to database for demo
    const updated = [...editingMembers]
    updated[currentMemberIndex] = member
    setEditingMembers(updated)
  }

  const handleNameSubmit = () => {
    if (familyName.trim()) {
      handleFamilyUpdate({ name: familyName.trim() })
      setTimeout(() => setCurrentStep('cooking-intro'), 500)
    }
  }

  const handleCookingSelect = (value: string) => {
    handleFamilyUpdate({ 
      preferences: { ...editingFamily.preferences, cookingSkillLevel: value as 'beginner' | 'intermediate' | 'advanced' }
    })
    const option = COOKING_OPTIONS.find(opt => opt.value === value)
    if (option) {
      const lines = option.feedback.split('\n').filter(line => line.trim())
      setFeedbackTypedLines(lines)
      setFeedbackCurrentLineIndex(0)
      setFeedbackTypedText('')
      setCurrentStep('cooking-feedback')
      setShowFeedback(true)
      
      // Clear any existing typing intervals/timeouts
      feedbackTypingRef.current.intervals.forEach(clearInterval)
      feedbackTypingRef.current.timeouts.forEach(clearTimeout)
      feedbackTypingRef.current = { intervals: [], timeouts: [] }
      
      // Start typing effect
      let currentLineIndex = 0
      let currentCharIndex = 0
      const currentLines = lines
      const typedLinesArray: string[] = []
      
      const typeLine = () => {
        if (currentLineIndex >= currentLines.length) {
          // All lines typed, wait 5 seconds then transition
          const timeout = setTimeout(() => {
            setShowFeedback(false)
            setCurrentStep('budget')
            setFeedbackTypedLines([])
            setFeedbackCurrentLineIndex(0)
            setFeedbackTypedText('')
          }, 5000)
          feedbackTypingRef.current.timeouts.push(timeout)
          return
        }
        
        const currentLine = currentLines[currentLineIndex]
        if (currentCharIndex < currentLine.length) {
          typedLinesArray[currentLineIndex] = currentLine.substring(0, currentCharIndex + 1)
          setFeedbackTypedLines([...typedLinesArray])
          setFeedbackCurrentLineIndex(currentLineIndex)
          setFeedbackTypedText(currentLine.substring(0, currentCharIndex + 1))
          currentCharIndex++
          const interval = setTimeout(typeLine, 30)
          feedbackTypingRef.current.intervals.push(interval)
        } else {
          // Line complete, move to next line
          typedLinesArray[currentLineIndex] = currentLine
          setFeedbackTypedLines([...typedLinesArray])
          currentLineIndex++
          currentCharIndex = 0
          if (currentLineIndex < currentLines.length) {
            // Add a small delay before starting next line
            const timeout = setTimeout(() => {
              typeLine()
            }, 200)
            feedbackTypingRef.current.timeouts.push(timeout)
          } else {
            // All lines typed, wait 5 seconds then transition
            const timeout = setTimeout(() => {
              setShowFeedback(false)
              setCurrentStep('budget')
              setFeedbackTypedLines([])
              setFeedbackCurrentLineIndex(0)
              setFeedbackTypedText('')
            }, 5000)
            feedbackTypingRef.current.timeouts.push(timeout)
          }
        }
      }
      
      typeLine()
    }
  }

  const handleBudgetSelect = (value: string) => {
    handleFamilyUpdate({ 
      preferences: { ...editingFamily.preferences, budgetRange: value as 'low' | 'medium' | 'high' }
    })
    const option = BUDGET_OPTIONS.find(opt => opt.value === value)
    if (option) {
      const lines = option.feedback.split('\n').filter(line => line.trim())
      setFeedbackTypedLines(lines)
      setFeedbackCurrentLineIndex(0)
      setFeedbackTypedText('')
      setCurrentStep('budget-feedback')
      setShowFeedback(true)
      
      // Clear any existing typing intervals/timeouts
      feedbackTypingRef.current.intervals.forEach(clearInterval)
      feedbackTypingRef.current.timeouts.forEach(clearTimeout)
      feedbackTypingRef.current = { intervals: [], timeouts: [] }
      
      // Start typing effect
      let currentLineIndex = 0
      let currentCharIndex = 0
      const currentLines = lines
      const typedLinesArray: string[] = []
      
      const typeLine = () => {
        if (currentLineIndex >= currentLines.length) {
          // All lines typed, wait 5 seconds then transition
          const timeout = setTimeout(() => {
            setShowFeedback(false)
            setCurrentStep('members')
            setCurrentMemberIndex(0)
            setFeedbackTypedLines([])
            setFeedbackCurrentLineIndex(0)
            setFeedbackTypedText('')
          }, 5000)
          feedbackTypingRef.current.timeouts.push(timeout)
          return
        }
        
        const currentLine = currentLines[currentLineIndex]
        if (currentCharIndex < currentLine.length) {
          typedLinesArray[currentLineIndex] = currentLine.substring(0, currentCharIndex + 1)
          setFeedbackTypedLines([...typedLinesArray])
          setFeedbackCurrentLineIndex(currentLineIndex)
          setFeedbackTypedText(currentLine.substring(0, currentCharIndex + 1))
          currentCharIndex++
          const interval = setTimeout(typeLine, 30)
          feedbackTypingRef.current.intervals.push(interval)
        } else {
          // Line complete, move to next line
          typedLinesArray[currentLineIndex] = currentLine
          setFeedbackTypedLines([...typedLinesArray])
          currentLineIndex++
          currentCharIndex = 0
          if (currentLineIndex < currentLines.length) {
            // Add a small delay before starting next line
            const timeout = setTimeout(() => {
              typeLine()
            }, 200)
            feedbackTypingRef.current.timeouts.push(timeout)
          } else {
            // All lines typed, wait 5 seconds then transition
            const timeout = setTimeout(() => {
              setShowFeedback(false)
              setCurrentStep('members')
              setCurrentMemberIndex(0)
              setFeedbackTypedLines([])
              setFeedbackCurrentLineIndex(0)
              setFeedbackTypedText('')
            }, 5000)
            feedbackTypingRef.current.timeouts.push(timeout)
          }
        }
      }
      
      typeLine()
    }
  }


  const currentMember = editingMembers[currentMemberIndex] || {
    id: '',
    name: '',
    age: 0,
    dietaryRestrictions: [],
    allergies: [],
    healthConditions: [],
    preferences: {
      spiceLevel: 'mild',
      favoriteCuisines: [],
      dislikedIngredients: []
    }
  }
  const cookingOption = COOKING_OPTIONS.find(o => o.key === selectedCooking || o.value === selectedCooking)
  const budgetOption = BUDGET_OPTIONS.find(o => o.value === selectedBudget)

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.background, 
      paddingTop: '64px',
      transition: 'background-color 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Colorful Apple-style Background Gradients - Stronger */}
      {currentStep === 'name' && (
        <>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${colors.primary}12 0%, ${colors.scan}18 50%, ${colors.success}12 100%)`,
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '450px',
            height: '450px',
            background: `radial-gradient(circle, ${colors.primary}25 0%, ${colors.primary}08 50%, transparent 70%)`,
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-8%',
            left: '-8%',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${colors.scan}22 0%, ${colors.scan}08 50%, transparent 70%)`,
            borderRadius: '50%',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '1s',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '350px',
            height: '350px',
            background: `radial-gradient(circle, ${colors.success}18 0%, ${colors.success}06 50%, transparent 70%)`,
            borderRadius: '50%',
            animation: 'float 9s ease-in-out infinite',
            animationDelay: '2s',
            zIndex: 0
          }} />
        </>
      )}

      <TopBar />

      {/* Step progress bar */}
      <div style={{
        padding: '12px 20px 8px',
        backgroundColor: colors.background,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          {STEP_ORDER.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor:
                  i < currentStepNumber - 1
                    ? colors.success
                    : i === currentStepNumber - 1
                      ? colors.primary
                      : colors.border,
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: colors.text, opacity: 0.5 }}>
          Step {currentStepNumber} of {totalSteps}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflow: 'hidden',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Step 1: Name Input */}
        {currentStep === 'name' && (
          <div style={{ 
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '32px 24px',
            maxWidth: '100%',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Praising Text with Typewriter Effect - Continued */}
            <div style={{ 
              fontSize: '17px', 
              fontWeight: 500, 
              color: colors.primary,
              marginBottom: '16px',
              lineHeight: '1.4',
              textAlign: 'center',
              minHeight: '24px',
              opacity: typedText ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}>
              {typedText}
              {typedText && typedText.length > 0 && typedText[typedText.length - 1] !== '!' && (
                <span style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '18px',
                  backgroundColor: colors.primary,
                  marginLeft: '2px',
                  animation: 'blink 1s infinite'
                }} />
              )}
            </div>
            
            {/* Second Sentence */}
            {typedText2 && (
              <div style={{ 
                fontSize: '15px', 
                fontWeight: 400, 
                color: colors.text,
                opacity: 0.7,
                marginBottom: '32px',
                lineHeight: '1.5',
                textAlign: 'center',
                minHeight: '22px',
                animation: 'fadeInUp 0.4s ease'
              }}>
                {typedText2}
                {typedText2.length > 0 && typedText2[typedText2.length - 1] !== '.' && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '16px',
                    backgroundColor: colors.text,
                    marginLeft: '2px',
                    animation: 'blink 1s infinite',
                    opacity: 0.5
                  }} />
                )}
              </div>
            )}

            {/* Main Headline - Apple Style Large Title - Sentence 3 with Typewriter */}
            {showMainText && (
              <div style={{ 
                fontSize: '34px', 
                fontWeight: 700, 
                color: colors.text,
                marginBottom: '72px',
                lineHeight: '1.2',
                textAlign: 'center',
                maxWidth: '320px',
                letterSpacing: '-0.5px',
                minHeight: '42px'
              }}>
                {typedText3}
                {typedText3.length > 0 && typedText3.length < "Let's make this journey yours".length && (
                  <span style={{
                    display: 'inline-block',
                    width: '3px',
                    height: '32px',
                    backgroundColor: colors.primary,
                    marginLeft: '4px',
                    animation: 'blink 1s infinite',
                    verticalAlign: 'middle'
                  }} />
                )}
              </div>
            )}

            {/* Name Input - Large and Clearly Editable with Animation */}
            {showInput && (
            <div style={{
              width: '100%',
              maxWidth: '320px',
              marginBottom: '56px',
              animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Input Bar */}
              <div style={{ 
                position: 'relative', 
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  placeholder=""
                  autoFocus={showInput && !familyName}
                  style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: colors.text,
                    border: 'none',
                    borderBottom: `4px solid ${colors.primary}`,
                    backgroundColor: 'transparent',
                    width: '100%',
                    maxWidth: '320px',
                    outline: 'none',
                    textAlign: 'left',
                    padding: '12px 0',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.scan
                    e.currentTarget.style.borderBottomWidth = '5px'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.primary
                    e.currentTarget.style.borderBottomWidth = '4px'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                />
                {/* Animated Placeholder - Cycling Examples */}
                {inputPlaceholderText && !familyName && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '12px',
                    fontSize: '36px',
                    fontWeight: 700,
                    color: colors.text,
                    opacity: 0.4,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap'
                  }}>
                    {inputPlaceholderText}
                    <span style={{
                      display: 'inline-block',
                      width: '3px',
                      height: '28px',
                      backgroundColor: colors.primary,
                      marginLeft: '4px',
                      animation: 'blink 1s infinite',
                      opacity: 0.6
                    }} />
                  </div>
                )}
              </div>
              {/* Family Label - Right Aligned Below Input */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingRight: '8px'
              }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  opacity: 0.8
                }}>
                  Family
                </span>
              </div>
            </div>
            )}

            {/* Continue Button - Apple Style */}
            {showInput && (
            <button
              onClick={handleNameSubmit}
              disabled={!familyName.trim()}
              style={{
                padding: '16px 48px',
                border: 'none',
                background: familyName.trim() 
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`
                  : colors.border,
                color: '#FFFFFF',
                fontSize: '17px',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: familyName.trim() ? 1 : 0.4,
                borderRadius: '12px',
                cursor: familyName.trim() ? 'pointer' : 'not-allowed',
                minWidth: '200px',
                minHeight: '44px',
                boxShadow: familyName.trim() ? `0 4px 16px ${colors.primary}30` : 'none',
                animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                if (familyName.trim()) {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.primary}50`
                }
              }}
              onMouseLeave={(e) => {
                if (familyName.trim()) {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${colors.primary}30`
                }
              }}
              onMouseDown={(e) => {
                if (familyName.trim()) {
                  e.currentTarget.style.transform = 'scale(0.98) translateY(0)'
                }
              }}
              onMouseUp={(e) => {
                if (familyName.trim()) {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                }
              }}
            >
              Get Started
            </button>
            )}
          </div>
        )}

        {/* Step 2: Cooking Intro - Praising Page with Typewriter */}
        {currentStep === 'cooking-intro' && (
          <div style={{ 
            animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
          }}>
            {/* Praising Message 1 - Typewriter Effect */}
            <div style={{ 
              fontSize: '34px', 
              fontWeight: 700, 
              color: colors.text, 
              marginBottom: '32px',
              lineHeight: '1.2',
              maxWidth: '320px',
              letterSpacing: '-0.5px',
              minHeight: '42px'
            }}            >
              {(() => {
                const fullText = cookingIntroText1
                const commaIndex = fullText.indexOf(',')
                if (commaIndex > 0 && commaIndex < fullText.length - 1) {
                  return (
                    <>
                      <span>{fullText.substring(0, commaIndex + 1)}</span>
                      <br />
                      <span style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>{fullText.substring(commaIndex + 1).replace('✨', '').trim()}</span>
                      {fullText.includes('✨') && (
                        <span style={{ 
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}> ✨</span>
                      )}
                    </>
                  )
                }
                return cookingIntroText1.split('✨').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>✨</span>
                    )}
                  </span>
                ))
              })()}
              {cookingIntroText1.length > 0 && cookingIntroText1.length < t('cookingIntroText1').replace('{0}', familyName.trim()).length && (
                <span style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  marginLeft: '4px',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'middle'
                }} />
              )}
            </div>
            
            {/* Praising Message 2 - Typewriter Effect */}
            {cookingIntroText1.length === t('cookingIntroText1').replace('{0}', familyName.trim()).length && (
              <div style={{ 
                fontSize: '20px', 
                color: colors.text, 
                opacity: 0.9,
                marginBottom: '24px',
                lineHeight: '1.5',
                maxWidth: '320px',
                minHeight: '30px'
              }}>
                {cookingIntroText2}
                {cookingIntroText2.length > 0 && cookingIntroText2.length < t('cookingIntroText2').length && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '20px',
                    backgroundColor: colors.text,
                    marginLeft: '2px',
                    animation: 'blink 1s infinite',
                    opacity: 0.5,
                    verticalAlign: 'middle'
                  }} />
                )}
              </div>
            )}
            
            {/* Praising Message 3 - Typewriter Effect */}
            {cookingIntroText2.length === t('cookingIntroText2').length && (
              <div style={{ 
                fontSize: '18px', 
                color: colors.text, 
                opacity: 0.8,
                marginBottom: '56px',
                lineHeight: '1.5',
                maxWidth: '320px',
                minHeight: '27px'
              }}>
                {cookingIntroText3.split('🍽️').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '20px'
                      }}>🍽️</span>
                    )}
                  </span>
                ))}
                {cookingIntroText3.length > 0 && cookingIntroText3.length < t('cookingIntroText3').length && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '18px',
                    backgroundColor: colors.text,
                    marginLeft: '2px',
                    animation: 'blink 1s infinite',
                    opacity: 0.5,
                    verticalAlign: 'middle'
                  }} />
                )}
              </div>
            )}
            
          </div>
        )}

        {/* Step 3: Cooking Question */}
        {currentStep === 'cooking' && (
          <div style={{ 
            animation: 'slideInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}>
            {/* Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${colors.primary}25 0%, ${colors.primary}08 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 12s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '250px',
              height: '250px',
              background: `radial-gradient(circle, ${colors.scan}25 0%, ${colors.scan}08 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />
            
            {/* Back Button - Apple Style */}
            <button
              onClick={() => setCurrentStep('cooking-intro')}
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
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
                opacity: 0.7,
                marginBottom: '16px',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.backgroundColor = `${colors.text}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ←
            </button>
            
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '48px',
              textAlign: 'center',
              lineHeight: '1.3',
              position: 'relative',
              zIndex: 1
            }}>
              How often do you cook?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
              {COOKING_OPTIONS.map((option, index) => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSelectedCooking(option.key)
                    handleCookingSelect(option.value)
                  }}
                  style={{
                    padding: '20px',
                    border: `2px solid ${colors.primary}40`,
                    background: `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`,
                    color: colors.text,
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: `slideInRight 0.4s ease ${index * 0.1}s`,
                    animationFillMode: 'both',
                    borderRadius: '12px',
                    boxShadow: `0 2px 8px ${colors.primary}15`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary
                    e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}15, ${colors.scan}10)`
                    e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = `0 4px 16px ${colors.primary}30`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${colors.primary}40`
                    e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`
                    e.currentTarget.style.transform = 'translateX(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary}15`
                  }}
                >
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{option.label}</div>
                  <div style={{ fontSize: '13px', color: colors.text, opacity: 0.8, marginTop: '4px', fontWeight: 400 }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Cooking Feedback */}
        {showFeedback && cookingOption && currentStep === 'cooking-feedback' && (
          <div style={{ 
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '350px',
              height: '350px',
              background: `radial-gradient(circle, ${colors.primary}30 0%, ${colors.primary}10 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              right: '10%',
              width: '280px',
              height: '280px',
              background: `radial-gradient(circle, ${colors.scan}30 0%, ${colors.scan}10 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />
            
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '32px',
              animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              position: 'relative',
              zIndex: 1
            }}>
              🎉
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: '1.6',
              padding: '0 16px',
              maxWidth: '100%',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
            }}>
              {feedbackTypedLines.map((line, index) => {
                // Show completed lines (before current line)
                if (index < feedbackCurrentLineIndex) {
                  return (
                    <div key={index} style={{ marginBottom: '14px' }}>
                      {line}
                    </div>
                  )
                }
                // Show current line being typed
                if (index === feedbackCurrentLineIndex) {
                  return (
                    <div key={index} style={{ marginBottom: index < feedbackTypedLines.length - 1 ? '14px' : '0' }}>
                      {feedbackTypedText || line}
                      <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '18px',
                        backgroundColor: colors.primary,
                        marginLeft: '2px',
                        animation: 'blink 1s infinite',
                        verticalAlign: 'middle'
                      }} />
                    </div>
                  )
                }
                // Don't show future lines
                return null
              })}
            </div>
          </div>
        )}

        {/* Step 5: Budget Question */}
        {currentStep === 'budget' && (
          <div style={{ 
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}>
            {/* Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${colors.scan}30 0%, ${colors.scan}10 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 12s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '280px',
              height: '280px',
              background: `radial-gradient(circle, ${colors.primary}30 0%, ${colors.primary}10 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              top: '30%',
              right: '5%',
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${colors.scan}20 0%, ${colors.scan}05 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 14s ease-in-out infinite',
              animationDelay: '2s',
              zIndex: 0
            }} />
            
            {/* Back Button - Apple Style */}
            <button
              onClick={() => setCurrentStep('cooking')}
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
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
                opacity: 0.7,
                marginBottom: '24px',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.backgroundColor = `${colors.text}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ←
            </button>
            
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              background: `linear-gradient(135deg, ${colors.scan}, ${colors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '48px',
              textAlign: 'center',
              lineHeight: '1.4',
              position: 'relative',
              zIndex: 1,
              padding: '0 16px'
            }}>
              What's your ideal budget?<br />We will make our best to match it with the recipes!
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
              {BUDGET_OPTIONS.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleBudgetSelect(option.value)}
                  style={{
                    padding: '20px',
                    border: `2px solid ${colors.scan}50`,
                    background: `linear-gradient(135deg, ${colors.background}, ${colors.scan}10)`,
                    color: colors.text,
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: `slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
                    borderRadius: '12px',
                    boxShadow: `0 2px 12px ${colors.scan}20`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.scan
                    e.currentTarget.style.background = `linear-gradient(135deg, ${colors.scan}20, ${colors.primary}15)`
                    e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.scan}40`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${colors.scan}50`
                    e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.scan}10)`
                    e.currentTarget.style.transform = 'translateX(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 2px 12px ${colors.scan}20`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        background: `linear-gradient(135deg, ${colors.scan}, ${colors.primary})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '17px'
                      }}>{option.label}</div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: colors.text, 
                        opacity: 0.85, 
                        marginTop: '6px', 
                        fontWeight: 500 
                      }}>
                        {option.amount}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Budget Feedback */}
        {showFeedback && budgetOption && currentStep === 'budget-feedback' && (
          <div style={{ 
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '380px',
              height: '380px',
              background: `radial-gradient(circle, ${colors.scan}35 0%, ${colors.scan}15 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '10%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${colors.primary}35 0%, ${colors.primary}15 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              top: '20%',
              right: '5%',
              width: '220px',
              height: '220px',
              background: `radial-gradient(circle, ${colors.scan}25 0%, ${colors.scan}08 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 12s ease-in-out infinite',
              animationDelay: '2s',
              zIndex: 0
            }} />
            
            <div style={{ 
              fontSize: '52px', 
              marginBottom: '36px',
              animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              position: 'relative',
              zIndex: 1
            }}>
              💰
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              background: `linear-gradient(135deg, ${colors.scan}, ${colors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: '1.6',
              padding: '0 16px',
              maxWidth: '100%',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
            }}>
              {feedbackTypedLines.map((line, index) => {
                // Show completed lines (before current line)
                if (index < feedbackCurrentLineIndex) {
                  return (
                    <div key={index} style={{ marginBottom: '14px' }}>
                      {line}
                    </div>
                  )
                }
                // Show current line being typed
                if (index === feedbackCurrentLineIndex) {
                  return (
                    <div key={index} style={{ marginBottom: index < feedbackTypedLines.length - 1 ? '14px' : '0' }}>
                      {feedbackTypedText || line}
                      <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '18px',
                        backgroundColor: colors.scan,
                        marginLeft: '2px',
                        animation: 'blink 1s infinite',
                        verticalAlign: 'middle'
                      }} />
                    </div>
                  )
                }
                // Don't show future lines
                return null
              })}
            </div>
          </div>
        )}

        {/* Step 7: Members - Full Page Mobile App Design */}
        {currentStep === 'members' && (
          <div style={{ 
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Full Page Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${colors.primary}12 0%, ${colors.scan}18 50%, ${colors.success}12 100%)`,
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              top: '-8%',
              right: '-3%',
              width: '320px',
              height: '320px',
              background: `radial-gradient(circle, ${colors.primary}35 0%, ${colors.primary}15 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-8%',
              left: '-3%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${colors.scan}35 0%, ${colors.scan}15 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 12s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />
            
            {/* Integrated Back Button */}
            <div style={{
              padding: '12px 20px 8px',
              position: 'relative',
              zIndex: 1
            }}>
              <button
                onClick={() => setCurrentStep('budget')}
                style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '20px',
                  fontWeight: 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.backgroundColor = `${colors.text}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                ←
              </button>
            </div>
            
            {/* Content Container - No padding, fits exactly */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 20px',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Name Input */}
              <div style={{ 
                marginBottom: '20px', 
                width: '100%',
                animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                animationFillMode: 'both'
              }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={currentMember.name}
                  onChange={(e) => handleMemberUpdate({ ...currentMember, name: e.target.value })}
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: colors.text,
                    border: 'none',
                    borderBottom: `3px solid ${colors.primary}`,
                    backgroundColor: 'transparent',
                    width: '100%',
                    outline: 'none',
                    textAlign: 'left',
                    padding: '10px 0',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.scan
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.primary
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                />
              </div>

              {/* Age Input */}
              <div style={{ 
                marginBottom: '24px', 
                width: '100%',
                animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
                animationFillMode: 'both'
              }}>
                <input
                  type="number"
                  placeholder="Age"
                  value={currentMember.age || ''}
                  onChange={(e) => handleMemberUpdate({ ...currentMember, age: parseInt(e.target.value) || 0 })}
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: colors.text,
                    border: 'none',
                    borderBottom: `3px solid ${colors.primary}`,
                    backgroundColor: 'transparent',
                    width: '100%',
                    outline: 'none',
                    textAlign: 'left',
                    padding: '10px 0',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.scan
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = colors.primary
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                />
              </div>

              {/* Dietary Restrictions - Matching previous form style */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 700, 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '12px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  Dietary Restrictions
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {/* Most popular 5: Vegetarian, Pescatarian, Halal, Keto, Gluten Free (excluding Vegan to avoid overlap) */}
                  {DIETARY_RESTRICTIONS.filter(d => d.value !== 'vegan').slice(0, 5).map((diet, index) => {
                    const isSelected = currentMember.dietaryRestrictions.includes(diet.value)
                    return (
                      <button
                        key={diet.value}
                        onClick={() => {
                          const updated = isSelected
                            ? currentMember.dietaryRestrictions.filter(d => d !== diet.value)
                            : [...currentMember.dietaryRestrictions, diet.value]
                          handleMemberUpdate({ ...currentMember, dietaryRestrictions: updated })
                        }}
                        style={{
                          padding: '20px 12px',
                          border: `2px solid ${isSelected ? colors.primary : `${colors.primary}40`}`,
                          background: isSelected 
                            ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
                            : `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`,
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: '16px',
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          animation: `slideInRight 0.4s ease ${index * 0.1}s`,
                          animationFillMode: 'both',
                          boxShadow: isSelected ? `0 4px 16px ${colors.primary}30` : `0 2px 8px ${colors.primary}15`
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = colors.primary
                            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}15, ${colors.scan}10)`
                            e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                            e.currentTarget.style.boxShadow = `0 4px 16px ${colors.primary}30`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = `${colors.primary}40`
                            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`
                            e.currentTarget.style.transform = 'translateX(0) scale(1)'
                            e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary}15`
                          }
                        }}
                      >
                        {diet.label}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => {
                      const othersInput = prompt('Enter other dietary restriction:')
                      if (othersInput && othersInput.trim()) {
                        handleMemberUpdate({ 
                          ...currentMember, 
                          dietaryRestrictions: [...currentMember.dietaryRestrictions, othersInput.trim() as any]
                        })
                      }
                    }}
                    style={{
                      padding: '20px 12px',
                      border: `2px solid ${colors.border}`,
                      background: `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`,
                      color: colors.text,
                      fontSize: '16px',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: `0 2px 8px ${colors.primary}15`,
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.borderColor = colors.primary
                      e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}15, ${colors.scan}10)`
                      e.currentTarget.style.transform = 'translateX(8px)'
                      e.currentTarget.style.boxShadow = `0 4px 16px ${colors.primary}30`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.primary}08)`
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary}15`
                    }}
                  >
                    Others
                  </button>
                </div>
              </div>

              {/* Allergies - Matching previous form style */}
              <div style={{ marginBottom: '0' }}>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 700, 
                  color: colors.danger, 
                  marginBottom: '12px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  Allergies
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {ALLERGY_OPTIONS.slice(0, 5).map((allergy, index) => {
                    const isSelected = currentMember.allergies.includes(allergy.value)
                    return (
                      <button
                        key={allergy.value}
                        onClick={() => {
                          const updated = isSelected
                            ? currentMember.allergies.filter(a => a !== allergy.value)
                            : [...currentMember.allergies, allergy.value]
                          handleMemberUpdate({ ...currentMember, allergies: updated })
                        }}
                        style={{
                          padding: '20px 12px',
                          border: `2px solid ${isSelected ? colors.danger : `${colors.danger}40`}`,
                          background: isSelected 
                            ? `linear-gradient(135deg, ${colors.danger}, ${colors.danger}dd)`
                            : `linear-gradient(135deg, ${colors.background}, ${colors.danger}08)`,
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: '16px',
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          animation: `slideInRight 0.4s ease ${index * 0.1}s`,
                          animationFillMode: 'both',
                          boxShadow: isSelected ? `0 4px 16px ${colors.danger}30` : `0 2px 8px ${colors.danger}15`
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = colors.danger
                            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.danger}15, ${colors.danger}08)`
                            e.currentTarget.style.transform = 'translateX(8px) scale(1.02)'
                            e.currentTarget.style.boxShadow = `0 4px 16px ${colors.danger}30`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = `${colors.danger}40`
                            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.danger}08)`
                            e.currentTarget.style.transform = 'translateX(0) scale(1)'
                            e.currentTarget.style.boxShadow = `0 2px 8px ${colors.danger}15`
                          }
                        }}
                      >
                        {allergy.label}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => {
                      const othersInput = prompt('Enter other allergy:')
                      if (othersInput && othersInput.trim()) {
                        handleMemberUpdate({ 
                          ...currentMember, 
                          allergies: [...currentMember.allergies, othersInput.trim() as any]
                        })
                      }
                    }}
                    style={{
                      padding: '20px 12px',
                      border: `2px solid ${colors.border}`,
                      background: `linear-gradient(135deg, ${colors.background}, ${colors.danger}08)`,
                      color: colors.text,
                      fontSize: '16px',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: `0 2px 8px ${colors.danger}15`,
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.borderColor = colors.danger
                      e.currentTarget.style.background = `linear-gradient(135deg, ${colors.danger}15, ${colors.danger}08)`
                      e.currentTarget.style.transform = 'translateX(8px)'
                      e.currentTarget.style.boxShadow = `0 4px 16px ${colors.danger}30`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.background = `linear-gradient(135deg, ${colors.background}, ${colors.danger}08)`
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = `0 2px 8px ${colors.danger}15`
                    }}
                  >
                    Others
                  </button>
                </div>
              </div>
            </div>
            
            {/* Integrated Sticky Bottom Buttons */}
            <div style={{ 
              position: 'sticky',
              bottom: 0,
              padding: '16px 20px',
              borderTop: `1px solid ${colors.border}40`, 
              backgroundColor: colors.background, 
              display: 'flex', 
              gap: '12px',
              zIndex: 10,
              boxShadow: `0 -2px 12px ${colors.border}20`,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
              animationFillMode: 'both'
            }}>
              <button
                onClick={() => {
                  setCurrentStep('summary')
                }}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: `2px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontSize: '17px',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
                Finish
              </button>
              <button
                onClick={() => {
                  const newMember: FamilyMember = {
                    id: '',
                    name: '',
                    age: 0,
                    dietaryRestrictions: [],
                    allergies: [],
                    healthConditions: [],
                    preferences: {
                      spiceLevel: 'mild' as 'mild',
                      favoriteCuisines: [],
                      dislikedIngredients: []
                    }
                  }
                  setEditingMembers([...editingMembers, newMember])
                  setCurrentMemberIndex(editingMembers.length)
                }}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  color: '#FFFFFF',
                  fontSize: '17px',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: `0 4px 16px ${colors.primary}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}50`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${colors.primary}40`
                }}
              >
                Add More
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Summary/Welcome */}
        {currentStep === 'summary' && (
          <div style={{ 
            animation: 'scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'center',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
            padding: '40px 20px'
          }}>
            {/* Vibrant Background */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: '400px',
              height: '400px',
              background: `radial-gradient(circle, ${colors.primary}30 0%, ${colors.primary}15 50%, transparent 70%)`,
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
              background: `radial-gradient(circle, ${colors.scan}30 0%, ${colors.scan}15 50%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'float 12s ease-in-out infinite',
              animationDelay: '1s',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '32px',
                animation: 'bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                animationDelay: '0.2s',
                animationFillMode: 'both'
              }}>
                🎉
              </div>
              <div style={{ 
                fontSize: '34px', 
                fontWeight: 700, 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '20px',
                lineHeight: '1.3',
                animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                animationFillMode: 'both'
              }}>
                Welcome, {familyName.trim()}!
              </div>
              <div style={{ 
                fontSize: '18px', 
                color: colors.text, 
                opacity: 0.8,
                marginBottom: '56px',
                lineHeight: '1.5',
                animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
                animationFillMode: 'both'
              }}>
                Join our 100,000+ users who never worry about cooking ideas again!
              </div>
              <button
                onClick={() => {
                  completeOnboarding()
                  // Small delay for smooth transition
                  setTimeout(() => {
                    window.location.reload()
                  }, 800)
                }}
                style={{
                  padding: '18px 56px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.scan})`,
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: `0 6px 20px ${colors.primary}40`,
                  animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s',
                  animationFillMode: 'both',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.primary}50`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}40`
                }}
              >
                Start Cooking!
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          33% { transform: translateY(-30px) translateX(15px) scale(1.05); }
          66% { transform: translateY(15px) translateX(-15px) scale(0.95); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
