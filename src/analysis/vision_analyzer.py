import cv2
import base64
import numpy as np
import time
from openai import OpenAI, OpenAIError
from typing import Dict, Tuple, List, Optional
import logging


class VisionAnalyzer:
    """Analyzes images using GPT-4o Vision to identify items and quantities."""
    
    def __init__(
        self, 
        api_key: str,
        model: str = "gpt-4o",
        max_tokens: int = 300,
        temperature: float = 0,
        retry_attempts: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Args:
            api_key: OpenAI API key
            model: Model name to use
            max_tokens: Maximum tokens for response
            temperature: Temperature for generation
            retry_attempts: Number of retry attempts on failure
            retry_delay: Delay between retries in seconds
        """
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.logger = logging.getLogger("FridgeTracker.VisionAnalyzer")
    
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
        
        import json
        
        for attempt in range(self.retry_attempts):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
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
                    max_tokens=self.max_tokens,
                    temperature=self.temperature
                )
                
                result_text = response.choices[0].message.content
                
                if not result_text:
                    raise ValueError("Empty response from API")
                
                self.logger.debug(f"GPT Response: {result_text[:200]}")
                
                # Clean up markdown formatting if present
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                
                result_json = json.loads(result_text)
                
                # Validate response structure
                required_keys = ['empty', 'items', 'quantity', 'description']
                if not all(key in result_json for key in required_keys):
                    raise ValueError(f"Invalid response structure. Missing keys: {set(required_keys) - set(result_json.keys())}")
                
                return result_json
                
            except OpenAIError as e:
                self.logger.warning(f"OpenAI API error (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay * (attempt + 1))  # Exponential backoff
                else:
                    self.logger.error(f"All retry attempts failed: {e}")
                    return self._get_error_response(f"API error: {str(e)[:50]}")
            
            except json.JSONDecodeError as e:
                self.logger.warning(f"JSON parsing error (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                self.logger.debug(f"Response was: {result_text if 'result_text' in locals() else 'No response'}")
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay)
                else:
                    return self._get_error_response("Failed to parse API response")
            
            except Exception as e:
                self.logger.error(f"Unexpected error in vision analysis: {e}")
                return self._get_error_response(f"Error: {str(e)[:50]}")
        
        return self._get_error_response("Max retries exceeded")
    
    def _get_error_response(self, error_msg: str) -> Dict[str, any]:
        """
        Generate a standard error response.
        
        Args:
            error_msg: Error message to include
            
        Returns:
            Error response dictionary
        """
        return {
            "empty": None,
            "items": [],
            "quantity": 0,
            "description": error_msg
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

