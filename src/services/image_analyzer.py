import os
import json
from google import genai
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional
import logging
from PIL import Image

logger = logging.getLogger(__name__)

class ImageAnalyzer:
    CATEGORIES = [
        'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
        'grains', 'condiments', 'beverages', 'snacks',
        'frozen', 'canned', 'other'
    ]
    
    def __init__(self):
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)
    
    def analyze_hand(self, image_path: str, inventory_context: Optional[str] = None) -> dict:
        prompt = self._build_prompt(inventory_context)
        
        if not Path(image_path).exists():
            return {"items": []}
        
        try:
            image = Image.open(image_path)
            response = self.client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=[prompt, image],
            )
            
            result_text = response.text.strip()
            
            if result_text.startswith('```json'):
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif result_text.startswith('```'):
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(result_text)
            # Guard: ensure items is always a list
            if not isinstance(result.get("items"), list):
                result["items"] = []
            return result
        except json.JSONDecodeError as e:
            logger.error("Gemini returned invalid JSON: %s | raw (first 500): %.500s", e, result_text)
            return {"items": []}
        except Exception as e:
            logger.exception("Error analyzing image: %s", e)
            return {"items": []}
    
    def _build_prompt(self, inventory_context: Optional[str]) -> str:
        categories_str = ", ".join(self.CATEGORIES)
        
        prompt = "=== TASK ===\n"
        prompt += "Analyze ALL items in the hand and return structured JSON.\n"
        prompt += "Ignore all background objects and noise - ONLY focus on what is clearly held in the hand.\n\n"
        
        if inventory_context:
            prompt += "=== CURRENT INVENTORY ===\n"
            prompt += inventory_context + "\n\n"
        
        prompt += "=== VALID CATEGORIES ===\n"
        prompt += categories_str + "\n\n"
        
        prompt += "=== OUTPUT FORMAT ===\n"
        prompt += "Return ONLY valid JSON in this exact format:\n"
        prompt += '{\n  "items": [\n'
        prompt += '    {"name": "item_name", "quantity": number, "category": "category"}\n'
        prompt += '  ]\n}\n\n'
        
        prompt += "=== CRITICAL RULES ===\n"
        
        if inventory_context:
            prompt += "1. If you detect items similar to inventory items, USE THE EXACT NAME from inventory\n"
            prompt += "   Examples:\n"
            prompt += '   - "Coke Zero" or "Coca Cola" → use "coke" (if in inventory)\n'
            prompt += '   - "Red Apple" or "Green Apple" → use "apple" (if in inventory)\n'
            prompt += '   - "Chicken Breast" → use exact inventory name if exists\n\n'
            prompt += "2. Consider inventory quantities for logical validation\n"
            prompt += "   - Cannot detect taking 6 eggs when only 4 exist in inventory\n"
            prompt += "   - Use common sense based on visible items and inventory context\n\n"
            prompt += "3. For NEW items not in inventory:\n"
        else:
            prompt += "1. For detected items:\n"
        
        prompt += "   - Use the most specific common name possible (remove brand names, colors, and sizes — but keep the food type: 'Coca-Cola' → 'soda', 'Evian' → 'water', 'Heinz Ketchup' → 'ketchup', NOT 'beverage' or 'condiment')\n"
        prompt += "   - Use singular form: 'grapes' → 'grape', 'apples' → 'apple'\n"
        prompt += "   - Keep compound foods: 'orange juice', 'chocolate milk', 'chicken breast'\n"
        prompt += "   - Assign most appropriate category from the valid list\n\n"
        
        if inventory_context:
            prompt += "4. If hand is empty: {\"items\": []}\n"
            prompt += "5. Return ONLY the JSON, no explanations or other text.\n\n"
        else:
            prompt += "2. If hand is empty: {\"items\": []}\n"
            prompt += "3. Return ONLY the JSON, no explanations or other text.\n\n"
        
        prompt += "=== EXAMPLES ===\n"
        prompt += 'Holding 1 apple: {"items": [{"name": "apple", "quantity": 1, "category": "fruits"}]}\n'
        prompt += 'Holding 2 eggs and 1 milk: {"items": [{"name": "egg", "quantity": 2, "category": "dairy"}, {"name": "milk", "quantity": 1, "category": "dairy"}]}\n'
        prompt += 'Empty hand: {"items": []}\n'
        
        return prompt

