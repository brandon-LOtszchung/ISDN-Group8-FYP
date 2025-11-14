import { InterfaceLanguage } from '@/types'

export const inventoryTranslations = {
  en: {
    // Meat
    'Chicken Breast': 'Chicken Breast',
    'Pork': 'Pork',
    'Beef': 'Beef',
    
    // Vegetables
    'Broccoli': 'Broccoli',
    'Tomatoes': 'Tomatoes',
    'Onion': 'Onion',
    'Garlic': 'Garlic',
    'Carrot': 'Carrot',
    'Potato': 'Potato',
    
    // Grains
    'Rice': 'Rice',
    'Noodles': 'Noodles',
    'Bread': 'Bread',
    
    // Dairy
    'Eggs': 'Eggs',
    'Milk': 'Milk',
    'Cheese': 'Cheese',
    'Butter': 'Butter',
    
    // Condiments
    'Soy Sauce': 'Soy Sauce',
    'Salt': 'Salt',
    'Sugar': 'Sugar',
    'Oil': 'Oil',
    'Vinegar': 'Vinegar',
    
    // Units
    'pieces': 'pcs',
    'piece': 'pc',
    'g': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'l': 'L',
    'bottle': 'bottle',
    'head': 'head',
    'bulb': 'bulb',
  },
  
  'zh-HK': {
    // Meat
    'Chicken Breast': '雞胸肉',
    'Pork': '豬肉',
    'Beef': '牛肉',
    
    // Vegetables
    'Broccoli': '西蘭花',
    'Tomatoes': '番茄',
    'Onion': '洋蔥',
    'Garlic': '蒜頭',
    'Carrot': '紅蘿蔔',
    'Potato': '薯仔',
    
    // Grains
    'Rice': '白米',
    'Noodles': '麵條',
    'Bread': '麵包',
    
    // Dairy
    'Eggs': '雞蛋',
    'Milk': '牛奶',
    'Cheese': '芝士',
    'Butter': '牛油',
    
    // Condiments
    'Soy Sauce': '豉油',
    'Salt': '鹽',
    'Sugar': '糖',
    'Oil': '油',
    'Vinegar': '醋',
    
    // Units
    'pieces': '個',
    'piece': '個',
    'g': '克',
    'kg': '公斤',
    'ml': '毫升',
    'l': '升',
    'bottle': '支',
    'head': '個',
    'bulb': '個',
  },
  
  fil: {
    // Meat
    'Chicken Breast': 'Chicken Breast',
    'Pork': 'Baboy',
    'Beef': 'Baka',
    
    // Vegetables
    'Broccoli': 'Broccoli',
    'Tomatoes': 'Kamatis',
    'Onion': 'Sibuyas',
    'Garlic': 'Bawang',
    'Carrot': 'Karot',
    'Potato': 'Patatas',
    
    // Grains
    'Rice': 'Bigas',
    'Noodles': 'Pancit',
    'Bread': 'Tinapay',
    
    // Dairy
    'Eggs': 'Itlog',
    'Milk': 'Gatas',
    'Cheese': 'Keso',
    'Butter': 'Mantikilya',
    
    // Condiments
    'Soy Sauce': 'Toyo',
    'Salt': 'Asin',
    'Sugar': 'Asukal',
    'Oil': 'Langis',
    'Vinegar': 'Suka',
    
    // Units
    'pieces': 'pcs',
    'piece': 'pc',
    'g': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'l': 'L',
    'bottle': 'bote',
    'head': 'ulo',
    'bulb': 'butil',
  },
  
  id: {
    // Meat
    'Chicken Breast': 'Dada Ayam',
    'Pork': 'Daging Babi',
    'Beef': 'Daging Sapi',
    
    // Vegetables
    'Broccoli': 'Brokoli',
    'Tomatoes': 'Tomat',
    'Onion': 'Bawang',
    'Garlic': 'Bawang Putih',
    'Carrot': 'Wortel',
    'Potato': 'Kentang',
    
    // Grains
    'Rice': 'Beras',
    'Noodles': 'Mi',
    'Bread': 'Roti',
    
    // Dairy
    'Eggs': 'Telur',
    'Milk': 'Susu',
    'Cheese': 'Keju',
    'Butter': 'Mentega',
    
    // Condiments
    'Soy Sauce': 'Kecap',
    'Salt': 'Garam',
    'Sugar': 'Gula',
    'Oil': 'Minyak',
    'Vinegar': 'Cuka',
    
    // Units
    'pieces': 'buah',
    'piece': 'buah',
    'g': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'l': 'L',
    'bottle': 'botol',
    'head': 'kepala',
    'bulb': 'siung',
  },
}

export function translateInventoryItem(itemName: string, lang: InterfaceLanguage): string {
  const translations = inventoryTranslations[lang] as Record<string, string>
  return translations[itemName] || itemName
}

export function translateUnit(unit: string, lang: InterfaceLanguage): string {
  const translations = inventoryTranslations[lang] as Record<string, string>
  return translations[unit] || unit
}

