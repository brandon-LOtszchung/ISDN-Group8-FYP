import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export type ThemeType = 'warm' | 'cool'

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  colors: ThemeColors
}

interface ThemeColors {
  primary: string
  text: string
  background: string
  border: string
  success: string
  danger: string
  scan: string
}

const warmColors: ThemeColors = {
  primary: '#FF6B35',
  text: '#2C3E50',
  background: '#FFFFFF',
  border: '#E0E0E0',
  success: '#27AE60',
  danger: '#C0392B',
  scan: '#F39C12',
}

const coolColors: ThemeColors = {
  primary: '#16A085',
  text: '#34495E',
  background: '#FFFFFF',
  border: '#E0E0E0',
  success: '#2ECC71',
  danger: '#E74C3C',
  scan: '#F39C12',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app-theme')
    return (saved === 'warm' || saved === 'cool') ? saved : 'warm'
  })

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme)
    localStorage.setItem('app-theme', newTheme)
  }

  const colors = theme === 'warm' ? warmColors : coolColors

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-text', colors.text)
    document.documentElement.style.setProperty('--color-background', colors.background)
    document.documentElement.style.setProperty('--color-border', colors.border)
    document.documentElement.style.setProperty('--color-success', colors.success)
    document.documentElement.style.setProperty('--color-danger', colors.danger)
    document.documentElement.style.setProperty('--color-scan', colors.scan)
  }, [colors])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

