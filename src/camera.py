"""Simple camera video recorder for fridge monitoring."""
import cv2
import numpy as np
import os
import tempfile
from datetime import datetime
from typing import Optional
import logging


class Camera:
    """Handles video recording from camera."""
    
    def __init__(self, camera_index: int = 0, camera_url: Optional[str] = None):
        """
        Initialize camera.
        
        Args:
            camera_index: Local camera device index
            camera_url: Network camera URL (optional)
        """
        self.camera_index = camera_index
        self.camera_url = camera_url
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_recording = False
        self.video_writer: Optional[cv2.VideoWriter] = None
        self.current_video_path: Optional[str] = None
        self.logger = logging.getLogger("Camera")
        
    def start(self) -> bool:
        """
        Open camera connection.
        
        Returns:
            True if successful
        """
        if self.camera_url:
            self.logger.info(f"Connecting to network camera: {self.camera_url}")
            self.cap = cv2.VideoCapture(self.camera_url)
        else:
            self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            self.logger.error("Failed to open camera")
            return False
        
        # Test read
        ret, frame = self.cap.read()
        if not ret:
            self.logger.error("Failed to read from camera")
            return False
        
        self.logger.info("Camera started successfully")
        return True
    
    def get_frame(self) -> Optional[np.ndarray]:
        """
        Get current frame from camera.
        
        Returns:
            Frame as numpy array or None
        """
        if not self.cap or not self.cap.isOpened():
            return None
        
        ret, frame = self.cap.read()
        return frame if ret else None
    
    def start_recording(self, output_dir: str = "temp_videos") -> bool:
        """
        Start recording video to temp file.
        
        Args:
            output_dir: Directory to store temp video
            
        Returns:
            True if recording started
        """
        if self.is_recording:
            self.logger.warning("Already recording")
            return False
        
        if not self.cap or not self.cap.isOpened():
            self.logger.error("Camera not started")
            return False
        
        # Create temp directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_video_path = os.path.join(output_dir, f"action_{timestamp}.mp4")
        
        # Get video properties
        # On Linux/Orange Pi, CAP_PROP_FPS often returns 0, so we use a default value
        fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0 or fps > 60:
            fps = 30  # Default to 30 FPS
            self.logger.warning(f"Unable to get camera FPS, using default: {fps}")
        
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        self.logger.info(f"Recording parameters: {width}x{height} @ {fps} FPS")
        
        # Initialize video writer (H.264 codec)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.video_writer = cv2.VideoWriter(
            self.current_video_path,
            fourcc,
            fps,
            (width, height)
        )
        
        if not self.video_writer.isOpened():
            self.logger.error("Failed to initialize video writer")
            return False
        
        self.is_recording = True
        self.logger.info(f"Recording started: {self.current_video_path}")
        return True
    
    def record_frame(self, frame: np.ndarray):
        """
        Write frame to video file.
        
        Args:
            frame: Video frame to write
        """
        if self.is_recording and self.video_writer:
            self.video_writer.write(frame)
    
    def stop_recording(self) -> Optional[str]:
        """
        Stop recording and return video file path.
        
        Returns:
            Path to recorded video file or None
        """
        if not self.is_recording:
            self.logger.warning("Not recording")
            return None
        
        self.is_recording = False
        
        if self.video_writer:
            self.video_writer.release()
            self.video_writer = None
        
        video_path = self.current_video_path
        self.current_video_path = None
        
        if video_path and os.path.exists(video_path):
            file_size = os.path.getsize(video_path) / (1024 * 1024)  # MB
            self.logger.info(f"Recording stopped: {video_path} ({file_size:.2f} MB)")
            return video_path
        
        return None
    
    def stop(self):
        """Release camera resources."""
        if self.is_recording:
            self.stop_recording()
        
        if self.cap:
            self.cap.release()
            self.cap = None
        
        self.logger.info("Camera stopped")

