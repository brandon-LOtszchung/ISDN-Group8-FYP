/**
 * Share recipe information using Web Share API with fallback to specific apps
 */
export async function shareRecipe(
  recipeName: string,
  recipeId: string,
  matchedCount: number,
  totalCount: number,
  estimatedCost: number | null
): Promise<void> {
  const matchPercentage = Math.round((matchedCount / totalCount) * 100)
  const costText = estimatedCost ? `Estimated cost: HK$${estimatedCost.toFixed(2)}` : ''
  
  const shareText = `🍽️ ${recipeName}\n\n` +
    `📊 Ingredients match: ${matchedCount}/${totalCount} (${matchPercentage}%)\n` +
    (costText ? `${costText}\n\n` : '\n') +
    `Check out this recipe suggestion from Your Cooking Partner! 👨‍🍳\n\n` +
    `Recipe ID: ${recipeId}`

  const shareData: ShareData = {
    title: recipeName,
    text: shareText,
  }

  // Try Web Share API first (works on mobile devices)
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error)
      }
      // Fall through to fallback methods
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareText)
    // You could show a toast notification here
    alert('Recipe information copied to clipboard!')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    // Last resort: show text in prompt
    prompt('Copy this recipe information:', shareText)
  }
}

/**
 * Share to WhatsApp specifically
 */
export function shareToWhatsApp(
  recipeName: string,
  recipeId: string,
  matchedCount: number,
  totalCount: number,
  estimatedCost: number | null
): void {
  const matchPercentage = Math.round((matchedCount / totalCount) * 100)
  const costText = estimatedCost ? `\n💰 Estimated cost: HK$${estimatedCost.toFixed(2)}` : ''
  
  const message = `🍽️ *${recipeName}*\n\n` +
    `📊 Ingredients match: ${matchedCount}/${totalCount} (${matchPercentage}%)\n` +
    costText +
    `\n\nCheck out this recipe suggestion from Your Cooking Partner! 👨‍🍳\n\n` +
    `Recipe ID: ${recipeId}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

/**
 * Share to WeChat (opens WeChat if installed, otherwise shows QR code or copy link)
 */
export function shareToWeChat(
  recipeName: string,
  recipeId: string,
  matchedCount: number,
  totalCount: number,
  estimatedCost: number | null
): void {
  const matchPercentage = Math.round((matchedCount / totalCount) * 100)
  const costText = estimatedCost ? `\n💰 Estimated cost: HK$${estimatedCost.toFixed(2)}` : ''
  
  const message = `🍽️ ${recipeName}\n\n` +
    `📊 Ingredients match: ${matchedCount}/${totalCount} (${matchPercentage}%)\n` +
    costText +
    `\n\nCheck out this recipe suggestion from Your Cooking Partner! 👨‍🍳\n\n` +
    `Recipe ID: ${recipeId}`

  // WeChat sharing on mobile (iOS/Android)
  // Note: WeChat's share API requires specific setup, so we'll use a generic approach
  // On mobile, this will try to open WeChat if the scheme is registered
  const wechatUrl = `weixin://dl/moments/?text=${encodeURIComponent(message)}`
  
  // Try to open WeChat app (works on mobile)
  const link = document.createElement('a')
  link.href = wechatUrl
  link.style.display = 'none'
  document.body.appendChild(link)
  
  try {
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
  } catch (error) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      alert('Recipe information copied! You can paste it in WeChat.')
    }).catch(() => {
      prompt('Copy this recipe information for WeChat:', message)
    })
    document.body.removeChild(link)
  }
}

