"""Cloud API client for video upload and analysis."""
import requests
import logging
from typing import Dict, Optional
import os


class APIClient:
    """Client for uploading videos to cloud API."""
    
    def __init__(
        self,
        api_url: str,
        timeout: int = 120,
        retry_attempts: int = 3
    ):
        """
        Initialize API client.
        
        Args:
            api_url: Base URL of cloud API
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts
        """
        self.api_url = api_url.rstrip('/')
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.logger = logging.getLogger("APIClient")
        self.session = requests.Session()
    
    def upload_video(self, video_path: str, metadata: Optional[Dict] = None) -> Dict:
        """
        Upload video to cloud for analysis.
        
        Args:
            video_path: Path to video file
            metadata: Optional metadata
            
        Returns:
            Analysis result dictionary
        """
        if not os.path.exists(video_path):
            return self._error_response("Video file not found")
        
        endpoint = f"{self.api_url}/api/analyze_video"
        file_size = os.path.getsize(video_path) / (1024 * 1024)  # MB
        
        self.logger.info(f"Uploading video: {video_path} ({file_size:.2f} MB)")
        
        for attempt in range(self.retry_attempts):
            try:
                with open(video_path, 'rb') as video_file:
                    files = {'video': video_file}
                    data = metadata or {}
                    
                    response = self.session.post(
                        endpoint,
                        files=files,
                        data=data,
                        timeout=self.timeout
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    self.logger.info(f"✓ Analysis complete: {result.get('description', 'Unknown')}")
                    return result
                
                elif response.status_code == 413:
                    return self._error_response("Video file too large")
                
                else:
                    self.logger.warning(f"API error {response.status_code} (attempt {attempt + 1})")
                    if attempt == self.retry_attempts - 1:
                        return self._error_response(f"API error: {response.status_code}")
            
            except requests.exceptions.Timeout:
                self.logger.warning(f"Request timeout (attempt {attempt + 1})")
                if attempt == self.retry_attempts - 1:
                    return self._error_response("Request timeout")
            
            except requests.exceptions.ConnectionError:
                self.logger.warning(f"Connection error (attempt {attempt + 1})")
                if attempt == self.retry_attempts - 1:
                    return self._error_response("Cannot reach cloud API")
            
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                return self._error_response(str(e))
        
        return self._error_response("Max retries exceeded")
    
    def health_check(self) -> bool:
        """
        Check if cloud API is reachable.
        
        Returns:
            True if API is healthy
        """
        try:
            response = self.session.get(
                f"{self.api_url}/api/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    def _error_response(self, error_msg: str) -> Dict:
        """Generate error response."""
        return {
            "success": False,
            "action": "ERROR",
            "description": error_msg,
            "items": [],
            "inventory": []
        }

