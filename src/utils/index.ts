import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr = 'MMM dd, yyyy') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function pluralize(count: number, singular: string, plural?: string) {
  if (count === 1) return singular
  return plural || `${singular}s`
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function calculateMatchScore(
  availableIngredients: string[],
  requiredIngredients: string[]
) {
  if (requiredIngredients.length === 0) return 0
  
  const matches = requiredIngredients.filter(ingredient =>
    availableIngredients.some(available =>
      available.toLowerCase().includes(ingredient.toLowerCase()) ||
      ingredient.toLowerCase().includes(available.toLowerCase())
    )
  )
  
  return Math.round((matches.length / requiredIngredients.length) * 100)
}

export function groupBy<T>(array: T[], key: keyof T) {
  return array.reduce((groups, item) => {
    const group = item[key] as string
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export function filterUnique<T>(array: T[], key?: keyof T) {
  if (!key) return [...new Set(array)]
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getHongKongTime() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Hong_Kong',
  })
}

export function getMealTimeGreeting() {
  const now = new Date()
  const hkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }))
  const hour = hkTime.getHours()
  
  if (hour < 11) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getCurrentMealType() {
  const now = new Date()
  const hkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }))
  const hour = hkTime.getHours()
  
  if (hour < 11) return 'breakfast'
  if (hour < 17) return 'lunch'
  return 'dinner'
}
