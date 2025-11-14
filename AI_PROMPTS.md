# AI Prompts Documentation

This document shows the exact prompts used for AI features in the Smart Fridge app.

---

## 1️⃣ FRIDGE PHOTO ANALYSIS (OpenAI Vision)

### **Model:** `gpt-4o` (GPT-4 with vision capabilities)

### **Purpose:** 
Analyze fridge photos to automatically detect and categorize food items.

### **Input:**
- Photo as base64 string
- System prompt defining task

### **Complete Prompt:**

```
You are a smart fridge AI assistant. Analyze this fridge photo and identify ALL food items you can see.

For each item, provide:
- name: Item name in English
- category: One of: vegetables, fruits, meat, seafood, dairy, grains, condiments, beverages, snacks, frozen, canned, other
- quantity: Estimated quantity (be reasonable)
- unit: Appropriate unit (pieces, g, kg, ml, l, bottle, head, bulb, etc.)
- confidence: Your confidence level (0.0 to 1.0)

Return ONLY a JSON array of items, no other text:
[
  {
    "name": "Chicken Breast",
    "category": "meat",
    "quantity": 2,
    "unit": "pieces",
    "confidence": 0.95
  }
]

Be specific with names (e.g., "Chicken Breast" not just "Chicken").
Estimate quantities conservatively.
Only include items you can clearly see.
```

### **Expected Output:**

```json
[
  {"name": "Chicken Breast", "category": "meat", "quantity": 2, "unit": "pieces", "confidence": 0.95},
  {"name": "Broccoli", "category": "vegetables", "quantity": 1, "unit": "head", "confidence": 0.92},
  {"name": "Eggs", "category": "dairy", "quantity": 12, "unit": "pieces", "confidence": 0.98},
  {"name": "Milk", "category": "dairy", "quantity": 1, "unit": "l", "confidence": 0.90},
  {"name": "Tomatoes", "category": "vegetables", "quantity": 3, "unit": "pieces", "confidence": 0.88}
]
```

### **Processing:**
1. Send photo to API
2. Parse JSON response
3. Validate categories
4. Merge duplicates from multiple photos (takes MAX quantity)
5. Show to user for review

---

## 2️⃣ RECIPE GENERATION (OpenAI Text)

### **Model:** `gpt-4o-mini` (Faster, cheaper for text generation)

### **Purpose:** 
Generate personalized recipes based on available ingredients, dietary restrictions, and preferences.

### **System Prompt:**

```
You are an expert chef and nutritionist specializing in Hong Kong home cooking and international cuisines.

Your task is to generate practical, family-friendly recipes based on available ingredients.

RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. Generate 3-5 diverse recipe options
3. Use as many available ingredients as possible
4. STRICTLY respect all dietary restrictions and allergies
5. Be specific with ingredient names and quantities
6. Provide clear, step-by-step instructions
7. Consider Hong Kong preferences and local ingredients
8. Make recipes practical for home cooking

Output format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "cuisine": "chinese|western|japanese|etc",
      "difficulty": "easy|medium|hard",
      "cookingTime": 30,
      "servings": 4,
      "ingredients": [
        {"name": "Chicken Breast", "quantity": 2, "unit": "pieces", "alternatives": ["Pork", "Tofu"]}
      ],
      "instructions": [
        {"instruction": "Step description", "duration": 5, "temperature": 180}
      ],
      "tags": ["quick", "healthy", "family-friendly"]
    }
  ]
}
```

### **User Prompt (Dynamic):**

```
Generate 3 recipes for 4 people with these requirements:

AVAILABLE INGREDIENTS:
- Chicken Breast
- Broccoli
- Rice
- Soy Sauce
- Eggs
- Tomatoes
- Onion
- Garlic

CUISINE PREFERENCES:
- chinese
- western

DIETARY RESTRICTIONS (MUST FOLLOW):
- vegetarian

ALLERGIES (MUST AVOID):
- nuts

REQUIREMENTS:
1. Prioritize using available ingredients
2. Suggest realistic alternatives for missing ingredients
3. Make recipes suitable for Hong Kong families
4. Consider the selected cuisine styles
5. Provide clear, numbered cooking steps
6. Include estimated cooking times
7. Add relevant tags (quick, healthy, budget-friendly, etc.)

Return ONLY the JSON response, no other text.
```

### **Expected Output:**

```json
{
  "recipes": [
    {
      "title": "Vegetarian Fried Rice with Eggs",
      "description": "Classic Hong Kong-style fried rice with fresh vegetables and fluffy eggs",
      "cuisine": "chinese",
      "difficulty": "easy",
      "cookingTime": 15,
      "servings": 4,
      "ingredients": [
        {"name": "Rice", "quantity": 3, "unit": "cups", "alternatives": []},
        {"name": "Eggs", "quantity": 4, "unit": "pieces", "alternatives": []},
        {"name": "Onion", "quantity": 1, "unit": "pieces", "alternatives": ["Shallots"]},
        {"name": "Garlic", "quantity": 3, "unit": "cloves", "alternatives": []},
        {"name": "Soy Sauce", "quantity": 3, "unit": "tbsp", "alternatives": ["Tamari"]},
        {"name": "Frozen Peas", "quantity": 100, "unit": "g", "alternatives": ["Corn"]}
      ],
      "instructions": [
        {"instruction": "Cook rice and let it cool (use day-old rice if available)", "duration": 20},
        {"instruction": "Beat eggs with a pinch of salt", "duration": 2},
        {"instruction": "Heat wok over high heat, add oil", "duration": 1},
        {"instruction": "Scramble eggs until just set, remove from wok", "duration": 2},
        {"instruction": "Add more oil, stir-fry garlic and onion until fragrant", "duration": 2},
        {"instruction": "Add rice, break up clumps, stir-fry for 3 minutes", "duration": 3},
        {"instruction": "Add soy sauce and eggs, mix well and serve hot", "duration": 2}
      ],
      "tags": ["quick", "vegetarian", "family-friendly", "comfort-food"]
    },
    {
      "title": "Tomato Egg Stir Fry",
      "description": "Classic Cantonese home-style dish with sweet tomatoes and fluffy eggs",
      "cuisine": "chinese",
      "difficulty": "easy",
      "cookingTime": 12,
      "servings": 4,
      "ingredients": [
        {"name": "Tomatoes", "quantity": 4, "unit": "pieces", "alternatives": []},
        {"name": "Eggs", "quantity": 6, "unit": "pieces", "alternatives": []},
        {"name": "Onion", "quantity": 1, "unit": "pieces", "alternatives": []},
        {"name": "Sugar", "quantity": 1, "unit": "tsp", "alternatives": []},
        {"name": "Salt", "quantity": 1, "unit": "tsp", "alternatives": []}
      ],
      "instructions": [
        {"instruction": "Cut tomatoes into wedges, dice onion", "duration": 3},
        {"instruction": "Beat eggs with pinch of salt", "duration": 1},
        {"instruction": "Heat oil, scramble eggs until just set, remove", "duration": 2},
        {"instruction": "Stir-fry onion and tomatoes until soft", "duration": 4},
        {"instruction": "Add sugar and salt, cook until tomatoes break down", "duration": 3},
        {"instruction": "Return eggs to pan, gently fold together and serve", "duration": 1}
      ],
      "tags": ["quick", "vegetarian", "cantonese", "comfort-food"]
    }
  ]
}
```

### **Processing:**
1. Check ingredient availability against user's inventory
2. Calculate match score (% of ingredients available)
3. Mark each ingredient as available/unavailable
4. Sort recipes by match score
5. Display to user

---

## 🔄 COMPLETE DATA FLOW

### **Photo Analysis:**
```
User Photo (JPEG)
  → Convert to Base64
  → Send to OpenAI Vision API
  → AI analyzes image
  → Returns JSON with detected items
  → Parse & validate
  → User reviews/edits
  → Save to Supabase inventory_items table
```

### **Recipe Generation:**
```
User Selections (cuisines) + Inventory (from DB)
  → Collect family dietary restrictions/allergies
  → Build dynamic prompt
  → Send to OpenAI GPT-4o-mini
  → AI generates 3-5 recipes
  → Parse JSON response
  → Check ingredient availability
  → Calculate match scores
  → Display recipes sorted by match
  → User selects recipe
  → Missing ingredients → Add to shopping list (Supabase)
```

---

## 💾 DATABASE UPDATES

### **After Photo Analysis:**
```sql
-- Multiple INSERT statements (one per detected item)
INSERT INTO inventory_items (family_id, name, category, quantity, unit, confidence)
VALUES 
  ('family-uuid', 'Chicken Breast', 'meat', 2, 'pieces', 0.95),
  ('family-uuid', 'Broccoli', 'vegetables', 1, 'head', 0.92),
  ...
```

### **After Adding to Shopping List:**
```sql
-- UPSERT (insert or update if exists)
INSERT INTO shopping_list_items (family_id, name, quantity, unit, alternatives)
VALUES 
  ('family-uuid', 'Ginger', 20, 'g', '{"Galangal"}'),
  ('family-uuid', 'Oyster Sauce', 2, 'tbsp', '{"Soy Sauce"}')
ON CONFLICT (family_id, name, unit) 
DO UPDATE SET quantity = EXCLUDED.quantity;
```

---

## 📊 COST ESTIMATES

**Photo Analysis:**
- Model: GPT-4o
- Cost: ~$0.01 per image (high detail)
- 5 photos = $0.05

**Recipe Generation:**
- Model: GPT-4o-mini  
- Cost: ~$0.0001 per request
- Negligible!

**Total per user onboarding: ~$0.05** ✅ Very affordable!

