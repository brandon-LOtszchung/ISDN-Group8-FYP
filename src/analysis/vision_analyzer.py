import cv2
import base64
import numpy as np
from openai import OpenAI
from typing import Dict, Tuple, List


class VisionAnalyzer:
    """Analyzes images using GPT-4o Vision to identify items and quantities."""
    
    def __init__(self, api_key: str):
        """
        Args:
        
            api_key: OpenAI API key
        """
        self.client = OpenAI(api_key=api_key)
    
    def _encode_image(self, frame: np.ndarray) -> str:
        """
        Args:
            frame: BGR image from OpenCV
            
        Returns:
            Base64 encoded JPEG string
        """
        _, buffer = cv2.imencode('.jpg', frame)
        return base64.b64encode(buffer).decode('utf-8')
    
    def analyze_hand_content(self, frame: np.ndarray, inventory_context: List[str] = None) -> Dict[str, any]:
        """
        Analyze what items the hand is holding.
        
        Args:
            frame: BGR image from OpenCV
            inventory_context: List of items currently in fridge for consistent naming
            
        Returns:
            Dictionary with 'items' (list), 'quantity' (int), 'description' (str)
        """
        base64_image = self._encode_image(frame)
        
        inventory_hint = ""
        if inventory_context:
            inventory_hint = f"\n\nCurrent fridge inventory (use these EXACT names if you see them):\n- " + "\n- ".join(inventory_context)
        
        prompt = f"""Analyze this image of a hand and identify what items it's holding.

Focus on:
1. Is the hand empty or holding something?
2. If holding something, what item(s)?
3. How many items? (quantity)
{inventory_hint}

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting.

Format:
{{"empty": true/false, "items": ["item1"], "quantity": number, "description": "brief description"}}

Examples:
{{"empty": true, "items": [], "quantity": 0, "description": "Empty hand"}}
{{"empty": false, "items": ["tomato"], "quantity": 1, "description": "One red tomato"}}
{{"empty": false, "items": ["egg"], "quantity": 3, "description": "Three eggs"}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300,
                temperature=0
            )
            
            import json
            result_text = response.choices[0].message.content
            
            print(f"[GPT Response] {result_text[:200]}")
            
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result_json = json.loads(result_text)
            
            return result_json
            
        except Exception as e:
            print(f"Vision API error: {e}")
            print(f"Response was: {result_text if 'result_text' in locals() else 'No response'}")
            return {
                "empty": None,
                "items": [],
                "quantity": 0,
                "description": f"Error: {str(e)[:50]}"
            }
    
    def compare_and_determine_action(self, before: Dict, after: Dict) -> Dict:
        """
        Compare before/after states to determine action.
        
        Args:
            before: Analysis result from first OUT image
            after: Analysis result from second OUT image
            
        Returns:
            Dictionary with action type and item details
        """
        before_empty = before.get("empty", None)
        after_empty = after.get("empty", None)
        
        if before_empty is False and after_empty is True:
            return {
                "action": "PLACED",
                "items": before["items"],
                "quantity": before["quantity"],
                "description": f"Placed {before['description']}"
            }
        elif before_empty is True and after_empty is False:
            return {
                "action": "REMOVED",
                "items": after["items"],
                "quantity": after["quantity"],
                "description": f"Removed {after['description']}"
            }
        elif before_empty is False and after_empty is False:
            if before["items"] != after["items"]:
                return {
                    "action": "SWAPPED",
                    "items": {"placed": before["items"], "removed": after["items"]},
                    "quantity": {"placed": before["quantity"], "removed": after["quantity"]},
                    "description": f"Swapped {before['description']} for {after['description']}"
                }
            else:
                return {
                    "action": "UNCLEAR",
                    "items": before["items"],
                    "quantity": before["quantity"],
                    "description": "Same item before and after"
                }
        else:
            return {
                "action": "UNCLEAR",
                "items": [],
                "quantity": 0,
                "description": "Unable to determine action"
            }

