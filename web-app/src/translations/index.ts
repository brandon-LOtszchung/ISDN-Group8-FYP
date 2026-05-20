import { InterfaceLanguage } from '@/types'

const translations: Record<InterfaceLanguage, Record<string, string>> = {
  en: {
    // Common
    next: 'Next',
    back: 'Back',
    continue: 'Continue',
    start: 'Start',
    complete: 'Complete',
    
    // Onboarding
    familyInfo: 'Family Info',
    members: 'Members',
    summary: 'Summary',
    cookingLevel: 'Cooking Level',
    budget: 'Budget',
    mealTimes: 'Meal Times',
    exampleFamily1: 'The Lee...',
    exampleFamily2: 'ISDN Cooking...',
    praiseText1: "You've made the perfect choice!",
    praiseText2: "Join 100,000+ families discovering amazing recipes every day.",
    praiseText3: "Let's make this journey yours",
    cookingIntroText1: 'Wonderful, {0}! ✨',
    cookingIntroText2: "We're excited to personalize your cooking journey!",
    cookingIntroText3: "Fill in a few quick questions to make every meal better! 🍽️",
    letsStart: "Let's Start",
    
    // Inventory
    myFridge: 'My Fridge',
    scanFridge: 'Scan Fridge',
    takePhotos: 'Take 2-3 photos',
    detect: 'Detect',
    detecting: 'Detecting...',
    noItems: 'No items',
    add: 'Add',
    remove: 'Remove',
    
    // Categories
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    meat: 'Meat',
    seafood: 'Seafood',
    dairy: 'Dairy',
    grains: 'Grains',
    condiments: 'Condiments',
    beverages: 'Beverages',
    snacks: 'Snacks',
    frozen: 'Frozen',
    canned: 'Canned',
    other: 'Other',
  },
  'zh-HK': {
    // Common
    next: '下一步',
    back: '返回',
    continue: '繼續',
    start: '開始',
    complete: '完成',
    
    // Onboarding
    familyInfo: '家庭資料',
    members: '成員',
    summary: '總結',
    cookingLevel: '烹飪水平',
    budget: '預算',
    mealTimes: '用餐時間',
    exampleFamily1: '李氏...',
    exampleFamily2: 'ISDN 烹飪...',
    praiseText1: '您做出了完美的選擇！',
    praiseText2: '加入超過 100,000 個每天發現精彩食譜的家庭。',
    praiseText3: '讓我們開始這段旅程',
    cookingIntroText1: '太棒了，{0} 家庭！ ✨',
    cookingIntroText2: '我們很興奮能為您個人化烹飪體驗！',
    cookingIntroText3: '讓我們問您幾個快速問題，讓每餐都變得精彩 🍽️',
    letsStart: '開始',
    
    // Inventory
    myFridge: '我的雪櫃',
    scanFridge: '掃描雪櫃',
    takePhotos: '拍攝 2-3 張照片',
    detect: '檢測',
    detecting: '檢測中...',
    noItems: '沒有物品',
    add: '添加',
    remove: '移除',
    
    // Categories
    vegetables: '蔬菜',
    fruits: '水果',
    meat: '肉類',
    seafood: '海鮮',
    dairy: '奶類',
    grains: '穀物',
    condiments: '調味料',
    beverages: '飲品',
    snacks: '小食',
    frozen: '冷凍',
    canned: '罐頭',
    other: '其他',
  },
  fil: {
    // Common
    next: 'Susunod',
    back: 'Bumalik',
    continue: 'Magpatuloy',
    start: 'Simula',
    complete: 'Tapos',
    
    // Onboarding
    familyInfo: 'Impormasyon ng Pamilya',
    members: 'Mga Miyembro',
    summary: 'Buod',
    cookingLevel: 'Antas ng Pagluluto',
    budget: 'Badyet',
    mealTimes: 'Oras ng Pagkain',
    exampleFamily1: 'Ang Lee...',
    exampleFamily2: 'ISDN Cooking...',
    praiseText1: 'Ginawa mo ang perpektong pagpipilian!',
    praiseText2: 'Sumali sa 100,000+ na pamilya na natutuklasan ang mga kamangha-manghang recipe araw-araw.',
    praiseText3: 'Gawin nating sa iyo ang journey na ito',
    cookingIntroText1: 'Kahanga-hanga, {0}! ✨',
    cookingIntroText2: 'Nasasabik kaming i-personalize ang iyong cooking journey!',
    cookingIntroText3: 'Punan ang ilang mabilis na tanong upang gawing mas mahusay ang bawat pagkain! 🍽️',
    letsStart: 'Magsimula',
    
    // Inventory
    myFridge: 'Aking Ref',
    scanFridge: 'I-scan ang Ref',
    takePhotos: 'Kumuha ng 2-3 larawan',
    detect: 'Tuklasin',
    detecting: 'Tinutuklas...',
    noItems: 'Walang items',
    add: 'Magdagdag',
    remove: 'Alisin',
    
    // Categories
    vegetables: 'Gulay',
    fruits: 'Prutas',
    meat: 'Karne',
    seafood: 'Seafood',
    dairy: 'Gatas',
    grains: 'Butil',
    condiments: 'Pampalasa',
    beverages: 'Inumin',
    snacks: 'Meryenda',
    frozen: 'Frozen',
    canned: 'Lata',
    other: 'Iba pa',
  },
  id: {
    // Common
    next: 'Berikutnya',
    back: 'Kembali',
    continue: 'Lanjut',
    start: 'Mulai',
    complete: 'Selesai',
    
    // Onboarding
    familyInfo: 'Info Keluarga',
    members: 'Anggota',
    summary: 'Ringkasan',
    cookingLevel: 'Tingkat Memasak',
    budget: 'Anggaran',
    mealTimes: 'Waktu Makan',
    exampleFamily1: 'Keluarga Lee...',
    exampleFamily2: 'ISDN Cooking...',
    praiseText1: 'Anda telah membuat pilihan yang sempurna!',
    praiseText2: 'Bergabunglah dengan 100,000+ keluarga yang menemukan resep menakjubkan setiap hari.',
    praiseText3: 'Mari kita mulai perjalanan ini',
    cookingIntroText1: 'Luar biasa, {0}! ✨',
    cookingIntroText2: 'Kami sangat senang mempersonalisasi perjalanan memasak Anda!',
    cookingIntroText3: 'Isi beberapa pertanyaan cepat untuk membuat setiap makanan menjadi lebih baik! 🍽️',
    letsStart: 'Mari Mulai',
    
    // Inventory
    myFridge: 'Kulkas Saya',
    scanFridge: 'Pindai Kulkas',
    takePhotos: 'Ambil 2-3 foto',
    detect: 'Deteksi',
    detecting: 'Mendeteksi...',
    noItems: 'Tidak ada item',
    add: 'Tambah',
    remove: 'Hapus',
    
    // Categories
    vegetables: 'Sayuran',
    fruits: 'Buah-buahan',
    meat: 'Daging',
    seafood: 'Seafood',
    dairy: 'Susu',
    grains: 'Biji-bijian',
    condiments: 'Bumbu',
    beverages: 'Minuman',
    snacks: 'Camilan',
    frozen: 'Beku',
    canned: 'Kaleng',
    other: 'Lainnya',
  },
}

export function t(key: string, lang: InterfaceLanguage = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key
}

export function getLanguageName(lang: InterfaceLanguage): string {
  const names = {
    en: 'English',
    'zh-HK': '繁體中文',
    fil: 'Filipino',
    id: 'Bahasa Indonesia',
  }
  return names[lang] || 'English'
}

