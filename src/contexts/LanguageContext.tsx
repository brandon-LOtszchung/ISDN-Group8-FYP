import { createContext, useContext, useState, ReactNode } from 'react'
import { InterfaceLanguage } from '@/types'
import { t as translate } from '@/translations'

interface LanguageContextType {
  language: InterfaceLanguage
  setLanguage: (lang: InterfaceLanguage) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'app-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<InterfaceLanguage>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored as InterfaceLanguage) || 'en'
  })

  const setLanguage = (lang: InterfaceLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  const t = (key: string) => {
    return translate(key, language)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

