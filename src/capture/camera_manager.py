import cv2
import threading
import time
import numpy as np
from typing import Optional, Callable


class CameraManager:
    """Manages video stream and frame capture from camera."""
    
    def __init__(self, camera_index: int = 0, camera_url: Optional[str] = None):
        """
        Initialize camera manager.
        
        Args:
            camera_index: Local camera device index (e.g., 0, 1)
            camera_url: Network camera URL (e.g., rtsp://ip:port/stream, http://ip:port/video)
        """
        self.camera_index = camera_index
        self.camera_url = camera_url
        self.cap: Optional[cv2.VideoCapture] = None
        self.current_frame: Optional[np.ndarray] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.frame_callback: Optional[Callable[[np.ndarray], None]] = None
        
    def start(self) -> bool:
        """Start the camera stream."""
        if self.is_running:
            return True
        
        # Use network URL if provided, otherwise use local camera index
        if self.camera_url:
            print(f"Connecting to network camera: {self.camera_url}")
            self.cap = cv2.VideoCapture(self.camera_url)
        else:
            self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            return False
        
        # Give camera time to initialize
        time.sleep(1.5 if not self.camera_url else 3.0)  # Network cameras need more time
        
        # Try to read a test frame
        ret, frame = self.cap.read()
        if not ret:
            return False
            
        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        return True
    
    def stop(self):
        """Stop the camera stream."""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        if self.cap:
            self.cap.release()
            self.cap = None
    
    def _capture_loop(self):
        """Continuously capture frames from camera."""
        while self.is_running:
            if self.cap:
                ret, frame = self.cap.read()
                if ret:
                    self.current_frame = frame
                    if self.frame_callback:
                        self.frame_callback(frame)
    
    def get_current_frame(self) -> Optional[np.ndarray]:
        """Get the most recent frame."""
        return self.current_frame.copy() if self.current_frame is not None else None
    
    def set_frame_callback(self, callback: Callable[[np.ndarray], None]):
        """Set callback to be called on each new frame."""
        self.frame_callback = callback

