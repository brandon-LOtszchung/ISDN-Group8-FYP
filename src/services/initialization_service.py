import os
import json
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Dict
from PIL import Image

class InitializationService:
    """Handle bulk fridge inventory initialization from multiple images"""
    
    CATEGORIES = [
        'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
        'grains', 'condiments', 'beverages', 'snacks',
        'frozen', 'canned', 'other'
    ]
    
    def __init__(self):
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash-image')
    
    def analyze_fridge_images(self, image_paths: List[str]) -> List[Dict]:
        """
        Analyze multiple fridge images and return complete inventory.
        Handles deduplication automatically via smart prompt.
        
        Args:
            image_paths: List of paths to fridge images
        
        Returns:
            List of detected items: [{"name": str, "quantity": float, "category": str}, ...]
        """
        if not image_paths:
            return []
        
        prompt = self._build_initialization_prompt()
        
        try:
            images = [Image.open(path) for path in image_paths if Path(path).exists()]
            
            if not images:
                return []
            
            content = [prompt] + images
            response = self.model.generate_content(content)
            
            result_text = response.text.strip()
            
            if result_text.startswith('```json'):
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif result_text.startswith('```'):
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(result_text)
            return result.get("items", [])
        
        except Exception as e:
            print(f"Error analyzing fridge images: {e}")
            return []
    
    def _build_initialization_prompt(self) -> str:
        """Build the prompt for multi-image fridge analysis"""
        categories_str = ", ".join(self.CATEGORIES)
        
        prompt = "=== TASK ===\n"
        prompt += "You are analyzing MULTIPLE photos of the SAME refrigerator to create a complete inventory.\n\n"
        
        prompt += "=== CRITICAL: DEDUPLICATION ===\n"
        prompt += "These photos may show OVERLAPPING AREAS from different angles.\n"
        prompt += "DO NOT count the same item multiple times if it appears in multiple images.\n"
        prompt += "Your goal: Provide a SINGLE, COMPLETE inventory of ALL UNIQUE items.\n\n"
        
        prompt += "=== VALID CATEGORIES ===\n"
        prompt += categories_str + "\n\n"
        
        prompt += "=== OUTPUT FORMAT ===\n"
        prompt += "Return ONLY valid JSON in this exact format:\n"
        prompt += '{\n  "items": [\n'
        prompt += '    {"name": "item_name", "quantity": number, "category": "category"}\n'
        prompt += '  ]\n}\n\n'
        
        prompt += "=== INSTRUCTIONS ===\n"
        prompt += "1. Look at ALL images together as a complete view of the refrigerator\n"
        prompt += "2. Identify ALL unique food and beverage items visible\n"
        prompt += "3. If the same item appears in multiple images (e.g., milk carton in image 1 and 2):\n"
        prompt += "   - Count it ONCE with the most accurate quantity you can determine\n"
        prompt += "   - Do NOT add quantities from different images of the same item\n"
        prompt += "4. Use simple, generic names:\n"
        prompt += "   - Remove colors, brands, sizes: 'red apple' → 'apple'\n"
        prompt += "   - Use singular form: 'apples' → 'apple', 'eggs' → 'egg'\n"
        prompt += "   - Keep compound names: 'orange juice', 'chocolate milk'\n"
        prompt += "5. Assign the most appropriate category from the valid list\n"
        prompt += "6. If refrigerator appears empty, return: {\"items\": []}\n\n"
        
        prompt += "=== DEDUPLICATION EXAMPLES ===\n"
        prompt += "Scenario: Image 1 shows 2 apples on shelf, Image 2 shows same 2 apples from different angle\n"
        prompt += 'Result: {\"items\": [{\"name\": \"apple\", \"quantity\": 2, \"category\": \"fruits\"}]}\n'
        prompt += "NOT: 4 apples (incorrect duplication)\n\n"
        
        prompt += "Scenario: Image 1 shows milk carton, Image 2 shows same milk carton in different lighting\n"
        prompt += 'Result: {\"items\": [{\"name\": \"milk\", \"quantity\": 1, \"category\": \"dairy\"}]}\n'
        prompt += "NOT: 2 milk cartons (incorrect duplication)\n\n"
        
        prompt += "Scenario: Image 1 shows top shelf with 3 eggs, Image 2 shows bottom drawer with 6 different eggs\n"
        prompt += 'Result: {\"items\": [{\"name\": \"egg\", \"quantity\": 9, \"category\": \"dairy\"}]}\n'
        prompt += "These are DIFFERENT eggs in different locations, so we add them.\n\n"
        
        prompt += "=== FINAL REMINDER ===\n"
        prompt += "Return ONLY the JSON, no explanations or other text.\n"
        
        return prompt

