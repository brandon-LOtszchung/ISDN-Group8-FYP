import os
import json
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

class ImageAnalyzer:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-3-pro-image-preview')
    
    def analyze_hand(self, image_path: str) -> dict:
        prompt = """
Analyze this image and tell me what the hand is holding.
Ignore all background objects and noise - ONLY focus on what is in the hand.

Return ONLY a valid JSON object in this exact format:
{
  "item": "item name or 'nothing'",
  "quantity": number
}

Rules:
- Use the simplest generic food/drink name
- Remove colors, sizes, temperatures (e.g., "red apple" → "apple")
- Use singular form (e.g., "grapes" → "grape")
- Keep compound foods (e.g., "orange juice", "chocolate milk", "chicken breast")
- Must be food or drink items only
- If hand is empty or unclear: {"item": "nothing", "quantity": 0}

Examples:
- Holding 1 red apple: {"item": "apple", "quantity": 1}
- Holding 3 green grapes: {"item": "grape", "quantity": 3}
- Holding orange juice carton: {"item": "orange juice", "quantity": 1}
- Holding nothing: {"item": "nothing", "quantity": 0}

Return ONLY the JSON, no other text.
"""
        
        if not Path(image_path).exists():
            return {"item": "error", "quantity": 0}
        
        image = genai.upload_file(image_path)
        response = self.model.generate_content([prompt, image])
        
        try:
            result_text = response.text.strip()
            if result_text.startswith('```json'):
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif result_text.startswith('```'):
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(result_text)
            return result
        except:
            return {"item": "error", "quantity": 0}

