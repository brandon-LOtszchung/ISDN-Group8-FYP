import { InterfaceLanguage } from '@/types'

export const translations = {
  en: {
    // Language selection
    selectLanguage: 'Select Language',
    
    // Onboarding
    welcome: 'Cooking inspiration, no more frustration!',
    subtitle: 'Happy cooking every day!',
    setupMessage: "Let's set up a personalized cooking assistant for your family",
    familyName: 'Family Name',
    familyNamePlaceholder: 'Example: The Lee Family',
    memberCount: 'How many family members?',
    includeAll: 'Including adults and children',
    startSetup: 'Start Setup',
    
    // Member form
    member: 'Member',
    memberName: 'Name',
    memberNamePlaceholder: 'Example: John, Jane',
    age: 'Age',
    yearsOld: 'years old',
    dietary: 'Dietary Habits',
    allergies: 'Allergies',
    optional: '(Optional)',
    next: 'Next',
    complete: 'Complete',
    
    // Dashboard
    hello: 'Hello!',
    whoEating: "Who's eating tonight?",
    selectAll: 'Select All',
    clear: 'Clear',
    fridgeInventory: 'Fridge Inventory',
    items: 'items',
    loading: 'Loading...',
    getRecipes: 'Get Recipe Suggestions',
    selectMembers: 'Please select family members',
    editFamily: 'Edit Family Info',
    removeConfirm: 'Remove this item?',
    
    // Recipe generation
    recipeTitle: 'Recipe Suggestions',
    selectCuisine: 'Select Cuisine',
    generating: 'Generating...',
    getRecipe: 'Get Recipes',
    generateMore: 'More',
    suggestedRecipes: 'Suggested Recipes',
    shareRecipe: 'Share Recipe',
    selectThenGenerate: 'Select cuisine, then generate',
    minutes: 'min',
    servings: 'servings',
    ingredients: 'ingredients',
    
    // Recipe detail
    recipeNotFound: 'Recipe not found',
    back: 'Back',
    ingredientsList: 'Ingredients',
    available: 'Available',
    haveIngredients: 'You have',
    needToBuy: 'Need to buy',
    addToShoppingList: 'Add to Shopping List',
    viewSteps: 'View',
    hideSteps: 'Hide',
    cookingSteps: 'Cooking Steps',
    previousStep: 'Previous',
    nextStep: 'Next',
    done: 'Done',
    duration: 'Duration',
    temperature: 'Temperature',
    
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
    
    // Cuisines
    chinese: 'Chinese',
    cantonese: 'Cantonese',
    sichuan: 'Sichuan',
    western: 'Western',
    italian: 'Italian',
    japanese: 'Japanese',
    korean: 'Korean',
    thai: 'Thai',
    vietnamese: 'Vietnamese',
    indian: 'Indian',
    mexican: 'Mexican',
    fusion: 'Fusion',
    
    // Dietary Restrictions
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    halal: 'Halal',
    kosher: 'Kosher',
    'low-sodium': 'Low Salt',
    'low-sugar': 'Low Sugar',
    'low-fat': 'Low Fat',
    keto: 'Keto',
    'gluten-free': 'Gluten Free',
    
    // Allergies
    nuts: 'Nuts',
    peanuts: 'Peanuts',
    dairyAllergy: 'Dairy',
    eggs: 'Eggs',
    shellfish: 'Shellfish',
    fish: 'Fish',
    soy: 'Soy',
    wheat: 'Wheat',
    sesame: 'Sesame',
    
    // Cooking Skills
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    // Budget
    low: 'Budget',
    medium: 'Moderate',
    high: 'Premium',
  },
  
  'zh-HK': {
    // Language selection
    selectLanguage: '選擇語言',
    
    // Onboarding
    welcome: '煮食靈感不再煩惱！',
    subtitle: '開心煮食每一天',
    setupMessage: '讓我們為您的家庭設定個人化煮食助手',
    familyName: '家庭稱呼',
    familyNamePlaceholder: '例如：李太太一家',
    memberCount: '家中有幾多位成員？',
    includeAll: '包括大人同小朋友',
    startSetup: '開始設定',
    
    // Member form
    member: '成員',
    memberName: '姓名',
    memberNamePlaceholder: '例如：阿明、媽媽',
    age: '年齡',
    yearsOld: '歲',
    dietary: '飲食習慣',
    allergies: '食物敏感',
    optional: '（可選）',
    next: '下一位',
    complete: '完成',
    
    // Dashboard
    hello: '你好！',
    whoEating: '今晚邊個食飯？',
    selectAll: '全選',
    clear: '清除',
    fridgeInventory: '雪櫃存貨',
    items: '樣',
    loading: '載入中...',
    getRecipes: '獲取煮食建議',
    selectMembers: '請先選擇家庭成員',
    editFamily: '編輯家庭資料',
    removeConfirm: '確定移除此項目？',
    
    // Recipe generation
    recipeTitle: '煮食建議',
    selectCuisine: '選擇菜式',
    generating: '生成中...',
    getRecipe: '獲取食譜',
    generateMore: '更多',
    suggestedRecipes: '建議食譜',
    shareRecipe: '分享食譜',
    selectThenGenerate: '選擇菜式，然後獲取建議',
    minutes: '分鐘',
    servings: '人份',
    ingredients: '材料',
    
    // Recipe detail
    recipeNotFound: '找不到食譜',
    back: '返回',
    ingredientsList: '材料清單',
    available: '可用材料',
    haveIngredients: '已有材料',
    needToBuy: '需要購買',
    addToShoppingList: '加入購物清單',
    viewSteps: '查看',
    hideSteps: '隱藏',
    cookingSteps: '煮食步驟',
    previousStep: '上一步',
    nextStep: '下一步',
    done: '完成',
    duration: '需時',
    temperature: '溫度',
    
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
    
    // Cuisines
    chinese: '中菜',
    cantonese: '粵菜',
    sichuan: '川菜',
    western: '西餐',
    italian: '意大利',
    japanese: '日本',
    korean: '韓國',
    thai: '泰國',
    vietnamese: '越南',
    indian: '印度',
    mexican: '墨西哥',
    fusion: '其他',
    
    // Dietary Restrictions
    vegetarian: '素食',
    vegan: '純素',
    pescatarian: '魚素',
    halal: '清真',
    kosher: '猶太',
    'low-sodium': '低鹽',
    'low-sugar': '低糖',
    'low-fat': '低脂',
    keto: '生酮',
    'gluten-free': '無麩質',
    
    // Allergies
    nuts: '果仁',
    peanuts: '花生',
    dairyAllergy: '奶類',
    eggs: '雞蛋',
    shellfish: '貝類',
    fish: '魚類',
    soy: '豆類',
    wheat: '小麥',
    sesame: '芝麻',
    
    // Cooking Skills
    beginner: '新手',
    intermediate: '一般',
    advanced: '高手',
    
    // Budget
    low: '慳錢',
    medium: '適中',
    high: '豐富',
    
    // Shopping list
    shoppingList: '購物清單',
    emptyShoppingList: '暫無購物項目',
    emptyShoppingListDesc: '查看食譜以添加材料',
    itemsToBuy: '需要購買',
    total: '共',
    clearList: '清空',
    remove: '移除',
    alternatives: '可替代',
    shoppingTip: '小提示：購物前再次檢查雪櫃，避免重複購買',
  },
  
  fil: {
    // Language selection
    selectLanguage: 'Pumili ng Wika',
    
    // Onboarding
    welcome: 'Inspirasyon sa pagluluto, walang frustrasyon!',
    subtitle: 'Masayang pagluluto araw-araw!',
    setupMessage: 'Mag-set up tayo ng personalized na tulong sa pagluluto para sa iyong pamilya',
    familyName: 'Pangalan ng Pamilya',
    familyNamePlaceholder: 'Halimbawa: Pamilya Lee',
    memberCount: 'Ilang miyembro ng pamilya?',
    includeAll: 'Kasama ang matatanda at bata',
    startSetup: 'Simulan',
    
    // Member form
    member: 'Miyembro',
    memberName: 'Pangalan',
    memberNamePlaceholder: 'Halimbawa: Juan, Maria',
    age: 'Edad',
    yearsOld: 'taong gulang',
    dietary: 'Dietary',
    allergies: 'Allergy',
    optional: '(Opsyonal)',
    next: 'Susunod',
    complete: 'Tapos',
    
    // Dashboard
    hello: 'Kumusta!',
    whoEating: 'Sino ang kakain ngayong gabi?',
    selectAll: 'Piliin Lahat',
    clear: 'Alisin',
    fridgeInventory: 'Laman ng Ref',
    items: 'items',
    loading: 'Naglo-load...',
    getRecipes: 'Kumuha ng Recipe',
    selectMembers: 'Piliin ang miyembro ng pamilya',
    editFamily: 'I-edit ang Pamilya',
    removeConfirm: 'Alisin ang item na ito?',
    
    // Recipe generation
    recipeTitle: 'Mga Recipe',
    selectCuisine: 'Piliin ang Kusina',
    generating: 'Gumagawa...',
    getRecipe: 'Kumuha ng Recipe',
    generateMore: 'Pa',
    suggestedRecipes: 'Mga Inirerekomendang Recipe',
    shareRecipe: 'I-share',
    selectThenGenerate: 'Pumili ng kusina, pagkatapos kumuha',
    minutes: 'minuto',
    servings: 'servings',
    ingredients: 'sangkap',
    
    // Recipe detail
    recipeNotFound: 'Hindi mahanap ang recipe',
    back: 'Bumalik',
    ingredientsList: 'Mga Sangkap',
    available: 'Available',
    haveIngredients: 'Mayroon ka',
    needToBuy: 'Kailangan bilhin',
    addToShoppingList: 'Idagdag sa Shopping List',
    viewSteps: 'Tingnan',
    hideSteps: 'Itago',
    cookingSteps: 'Mga Hakbang',
    previousStep: 'Nakaraan',
    nextStep: 'Susunod',
    done: 'Tapos',
    duration: 'Tagal',
    temperature: 'Temperatura',
    
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
    
    // Cuisines
    chinese: 'Chinese',
    cantonese: 'Cantonese',
    sichuan: 'Sichuan',
    western: 'Western',
    italian: 'Italian',
    japanese: 'Japanese',
    korean: 'Korean',
    thai: 'Thai',
    vietnamese: 'Vietnamese',
    indian: 'Indian',
    mexican: 'Mexican',
    fusion: 'Iba pa',
    
    // Dietary Restrictions
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    halal: 'Halal',
    kosher: 'Kosher',
    'low-sodium': 'Low Salt',
    'low-sugar': 'Low Sugar',
    'low-fat': 'Low Fat',
    keto: 'Keto',
    'gluten-free': 'Gluten Free',
    
    // Allergies
    nuts: 'Nuts',
    peanuts: 'Peanuts',
    dairyAllergy: 'Gatas',
    eggs: 'Itlog',
    shellfish: 'Shellfish',
    fish: 'Isda',
    soy: 'Soy',
    wheat: 'Trigo',
    sesame: 'Sesame',
    
    // Cooking Skills
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    // Budget
    low: 'Budget',
    medium: 'Moderate',
    high: 'Premium',
    
    // Shopping list
    shoppingList: 'Shopping List',
    emptyShoppingList: 'Walang bibilhin',
    emptyShoppingListDesc: 'Tingnan ang recipes para magdagdag',
    itemsToBuy: 'Bibilhin',
    total: 'Total',
    clearList: 'Alisin Lahat',
    remove: 'Alisin',
    alternatives: 'Pamalit',
    shoppingTip: 'Tip: Tingnan ang ref bago bumili para hindi paulit',
  },
  
  id: {
    // Language selection
    selectLanguage: 'Pilih Bahasa',
    
    // Onboarding
    welcome: 'Inspirasi memasak, tanpa frustrasi!',
    subtitle: 'Memasak dengan senang setiap hari!',
    setupMessage: 'Mari siapkan asisten memasak yang dipersonalisasi untuk keluarga Anda',
    familyName: 'Nama Keluarga',
    familyNamePlaceholder: 'Contoh: Keluarga Lee',
    memberCount: 'Berapa anggota keluarga?',
    includeAll: 'Termasuk dewasa dan anak-anak',
    startSetup: 'Mulai',
    
    // Member form
    member: 'Anggota',
    memberName: 'Nama',
    memberNamePlaceholder: 'Contoh: John, Jane',
    age: 'Umur',
    yearsOld: 'tahun',
    dietary: 'Kebiasaan Makan',
    allergies: 'Alergi',
    optional: '(Opsional)',
    next: 'Berikutnya',
    complete: 'Selesai',
    
    // Dashboard
    hello: 'Halo!',
    whoEating: 'Siapa yang makan malam ini?',
    selectAll: 'Pilih Semua',
    clear: 'Hapus',
    fridgeInventory: 'Isi Kulkas',
    items: 'item',
    loading: 'Memuat...',
    getRecipes: 'Dapatkan Resep',
    selectMembers: 'Silakan pilih anggota keluarga',
    editFamily: 'Edit Info Keluarga',
    removeConfirm: 'Hapus item ini?',
    
    // Recipe generation
    recipeTitle: 'Saran Resep',
    selectCuisine: 'Pilih Jenis Masakan',
    generating: 'Membuat...',
    getRecipe: 'Dapatkan Resep',
    generateMore: 'Lagi',
    suggestedRecipes: 'Resep yang Disarankan',
    shareRecipe: 'Bagikan',
    selectThenGenerate: 'Pilih jenis masakan, lalu dapatkan',
    minutes: 'menit',
    servings: 'porsi',
    ingredients: 'bahan',
    
    // Recipe detail
    recipeNotFound: 'Resep tidak ditemukan',
    back: 'Kembali',
    ingredientsList: 'Daftar Bahan',
    available: 'Tersedia',
    haveIngredients: 'Anda punya',
    needToBuy: 'Perlu dibeli',
    addToShoppingList: 'Tambah ke Daftar Belanja',
    viewSteps: 'Lihat',
    hideSteps: 'Sembunyikan',
    cookingSteps: 'Langkah Memasak',
    previousStep: 'Sebelumnya',
    nextStep: 'Berikutnya',
    done: 'Selesai',
    duration: 'Durasi',
    temperature: 'Suhu',
    
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
    
    // Cuisines
    chinese: 'Chinese',
    cantonese: 'Cantonese',
    sichuan: 'Sichuan',
    western: 'Western',
    italian: 'Italian',
    japanese: 'Japanese',
    korean: 'Korean',
    thai: 'Thai',
    vietnamese: 'Vietnamese',
    indian: 'Indian',
    mexican: 'Mexican',
    fusion: 'Lainnya',
    
    // Dietary Restrictions
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    halal: 'Halal',
    kosher: 'Kosher',
    'low-sodium': 'Rendah Garam',
    'low-sugar': 'Rendah Gula',
    'low-fat': 'Rendah Lemak',
    keto: 'Keto',
    'gluten-free': 'Bebas Gluten',
    
    // Allergies
    nuts: 'Kacang',
    peanuts: 'Kacang Tanah',
    dairyAllergy: 'Susu',
    eggs: 'Telur',
    shellfish: 'Kerang',
    fish: 'Ikan',
    soy: 'Kedelai',
    wheat: 'Gandum',
    sesame: 'Wijen',
    
    // Cooking Skills
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Mahir',
    
    // Budget
    low: 'Hemat',
    medium: 'Sedang',
    high: 'Premium',
    
    // Shopping list
    shoppingList: 'Daftar Belanja',
    emptyShoppingList: 'Tidak ada belanjaan',
    emptyShoppingListDesc: 'Lihat resep untuk menambah bahan',
    itemsToBuy: 'Perlu Dibeli',
    total: 'Total',
    clearList: 'Hapus Semua',
    remove: 'Hapus',
    alternatives: 'Alternatif',
    shoppingTip: 'Tips: Cek kulkas sebelum belanja agar tidak duplikat',
  },
}

export function t(key: string, lang: InterfaceLanguage = 'en'): string {
  const langTranslations = translations[lang] as Record<string, string>
  const enTranslations = translations.en as Record<string, string>
  return langTranslations[key] || enTranslations[key] || key
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

