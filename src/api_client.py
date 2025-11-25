"""REST API client for communicating with cloud backend."""
import requests
import cv2
import numpy as np
import base64
import logging
from typing import Dict, Optional, Tuple, List
import time


class CloudAPIClient:
    """Client for sending captured images to cloud API for analysis."""
    
    def __init__(
        self,
        api_url: str,
        api_key: Optional[str] = None,
        timeout: int = 30,
        retry_attempts: int = 3,
        retry_delay: float = 2.0
    ):
        """
        Args:
            api_url: Base URL of cloud API (e.g., https://your-api.com)
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts on failure
            retry_delay: Delay between retries in seconds
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.logger = logging.getLogger("CameraEdge.APIClient")
        
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})
    
    def _encode_image(self, frame: np.ndarray) -> str:
        """
        Encode image to base64 JPEG string.
        
        Args:
            frame: BGR image from OpenCV
            
        Returns:
            Base64 encoded JPEG string
        """
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode('utf-8')
    
    def analyze_action(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Send before/after images to cloud for analysis.
        
        Args:
            before_image: First captured image (hand approaching)
            after_image: Second captured image (hand leaving)
            metadata: Optional metadata (timestamps, blur scores, etc.)
            
        Returns:
            Dictionary with analysis results:
            {
                "success": bool,
                "action": "PLACED" | "REMOVED" | "UNCLEAR",
                "items": ["item1", "item2"],
                "quantity": int,
                "description": str,
                "inventory": ["2x tomato", "1x egg"]  # updated inventory
            }
        """
        endpoint = f"{self.api_url}/api/analyze"
        
        self.logger.info(f"Sending images to cloud API: {endpoint}")
        
        # Prepare payload
        payload = {
            "before_image": self._encode_image(before_image),
            "after_image": self._encode_image(after_image),
            "metadata": metadata or {}
        }
        
        # Retry logic
        for attempt in range(self.retry_attempts):
            try:
                response = self.session.post(
                    endpoint,
                    json=payload,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.logger.info(f"✓ Analysis complete: {result.get('description', 'Unknown')}")
                    return result
                
                elif response.status_code == 401:
                    self.logger.error("Authentication failed - check API key")
                    return self._get_error_response("Authentication failed")
                
                elif response.status_code == 429:
                    self.logger.warning(f"Rate limited (attempt {attempt + 1}/{self.retry_attempts})")
                    if attempt < self.retry_attempts - 1:
                        time.sleep(self.retry_delay * (attempt + 1))
                        continue
                    return self._get_error_response("Rate limit exceeded")
                
                else:
                    self.logger.warning(f"API error {response.status_code}: {response.text[:100]}")
                    if attempt < self.retry_attempts - 1:
                        time.sleep(self.retry_delay)
                        continue
                    return self._get_error_response(f"API error: {response.status_code}")
            
            except requests.exceptions.Timeout:
                self.logger.warning(f"Request timeout (attempt {attempt + 1}/{self.retry_attempts})")
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay)
                    continue
                return self._get_error_response("Request timeout")
            
            except requests.exceptions.ConnectionError as e:
                self.logger.warning(f"Connection error (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                return self._get_error_response("Cannot reach cloud API")
            
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                return self._get_error_response(f"Error: {str(e)[:50]}")
        
        return self._get_error_response("Max retries exceeded")
    
    def _get_error_response(self, error_msg: str) -> Dict:
        """
        Generate standard error response.
        
        Args:
            error_msg: Error message
            
        Returns:
            Error response dictionary
        """
        return {
            "success": False,
            "action": "ERROR",
            "items": [],
            "quantity": 0,
            "description": error_msg,
            "inventory": []
        }
    
    def health_check(self) -> bool:
        """
        Check if cloud API is reachable.
        
        Returns:
            True if API is healthy, False otherwise
        """
        try:
            response = self.session.get(
                f"{self.api_url}/api/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    def get_inventory(self) -> List[str]:
        """
        Get current inventory from cloud.
        
        Returns:
            List of inventory items (e.g., ["2x tomato", "1x egg"])
        """
        try:
            response = self.session.get(
                f"{self.api_url}/api/inventory",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("inventory", [])
            return []
        except Exception as e:
            self.logger.error(f"Failed to fetch inventory: {e}")
            return []

