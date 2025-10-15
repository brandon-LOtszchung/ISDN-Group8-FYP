import cv2
import threading
import time
from typing import Optional, Callable


class CameraManager:
    """Manages video stream and frame capture from camera."""
    
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.current_frame: Optional[any] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.frame_callback: Optional[Callable] = None
        
    def start(self) -> bool:
        """Start the camera stream."""
        if self.is_running:
            return True
            
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            return False
        
        # Give camera time to initialize (important on macOS)
        time.sleep(1.5)
        
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
    
    def get_current_frame(self) -> Optional[any]:
        """Get the most recent frame."""
        return self.current_frame.copy() if self.current_frame is not None else None
    
    def set_frame_callback(self, callback: Callable):
        """Set callback to be called on each new frame."""
        self.frame_callback = callback

