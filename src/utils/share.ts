import { Recipe } from '@/types'

/**
 * Format recipe for sharing
 */
export function formatRecipeForShare(recipe: Recipe, language: string): string {
  const title = language === 'zh-HK' ? '食譜分享' : 'Recipe Share'
  const ingredientsLabel = language === 'zh-HK' ? '材料：' : 'Ingredients:'
  const stepsLabel = language === 'zh-HK' ? '步驟：' : 'Steps:'
  
  let text = `📖 ${title}\n\n`
  text += `${recipe.title}\n`
  text += `⏱ ${recipe.cookingTime}min | 👥 ${recipe.servings} servings\n\n`
  
  text += `${ingredientsLabel}\n`
  recipe.ingredients.forEach((ing) => {
    text += `• ${ing.name} - ${ing.quantity} ${ing.unit}\n`
  })
  
  text += `\n${stepsLabel}\n`
  recipe.instructions.forEach((step) => {
    text += `${step.step}. ${step.instruction}\n`
  })
  
  return text
}

/**
 * Share recipe via WhatsApp
 */
export function shareViaWhatsApp(recipe: Recipe, language: string): void {
  const text = formatRecipeForShare(recipe, language)
  const encoded = encodeURIComponent(text)
  const url = `https://wa.me/?text=${encoded}`
  window.open(url, '_blank')
}

/**
 * Share recipe via WeChat (uses system share if available)
 */
export function shareViaWeChat(recipe: Recipe, language: string): void {
  const text = formatRecipeForShare(recipe, language)
  
  // Try native share API first (works on mobile)
  if (navigator.share) {
    navigator.share({
      title: recipe.title,
      text: text,
    }).catch((error) => {
      console.error('Share failed:', error)
    })
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert(language === 'zh-HK' ? '已複製到剪貼板！' : 'Copied to clipboard!')
    }).catch(() => {
      alert(language === 'zh-HK' ? '複製失敗' : 'Copy failed')
    })
  }
}

/**
 * Generic share function - tries native share API
 */
export function shareRecipe(recipe: Recipe, language: string): void {
  const text = formatRecipeForShare(recipe, language)
  
  if (navigator.share) {
    // Native share (mobile)
    navigator.share({
      title: recipe.title,
      text: text,
    }).catch((error) => {
      console.error('Share failed:', error)
    })
  } else {
    // Desktop fallback: Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert(language === 'zh-HK' ? '已複製到剪貼板！在WhatsApp或微信中粘貼' : 'Copied! Paste in WhatsApp or WeChat')
    })
  }
}

