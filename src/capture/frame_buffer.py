from typing import List, Tuple, Optional
import numpy as np


class FrameBuffer:
    """Stores captured frames with their blur scores and direction."""
    
    def __init__(self, capture_interval: int = 3, blur_threshold: float = 100.0):
        self.frames: List[Tuple[np.ndarray, float, str]] = []
        self.rejected_count = 0  # Track frames rejected due to blur
        self.frame_counter = 0
        self.capture_interval = capture_interval
        self.blur_threshold = blur_threshold  # Minimum acceptable blur score
        
    def should_capture(self) -> bool:
        """Determine if current frame should be captured based on interval."""
        self.frame_counter += 1
        if self.frame_counter >= self.capture_interval:
            self.frame_counter = 0
            return True
        return False
    
    def add_frame(self, frame: np.ndarray, blur_score: float, direction: str = "UNKNOWN"):
        """Add a frame with its blur score and direction to the buffer if it meets threshold."""
        if blur_score >= self.blur_threshold:
            self.frames.append((frame.copy(), blur_score, direction))
        else:
            self.rejected_count += 1
    
    def get_best_frame(self) -> Tuple[Optional[np.ndarray], float, str]:
        """
        Returns:
            Tuple of (frame, blur_score, direction) for sharpest image
        """
        if not self.frames:
            return None, 0.0, "UNKNOWN"
        return max(self.frames, key=lambda x: x[1])
    
    def get_top_frames(self, count: int = 5) -> List[Tuple[np.ndarray, float, str]]:
        """
        Args:
            count: Number of top frames to return
            
        Returns:
            List of (frame, blur_score, direction) tuples sorted by sharpness
        """
        if not self.frames:
            return []
        sorted_frames = sorted(self.frames, key=lambda x: x[1], reverse=True)
        return sorted_frames[:count]
    
    def clear(self):
        """Clear all stored frames and reset counter."""
        self.frames.clear()
        self.rejected_count = 0
        self.frame_counter = 0
    
    def get_frame_count(self) -> int:
        """Get number of stored frames."""
        return len(self.frames)
    
    def get_statistics(self) -> dict:
        """
        Returns:
            Dictionary with frame statistics
        """
        if not self.frames:
            return {
                'count': 0,
                'rejected': self.rejected_count,
                'avg_blur': 0.0,
                'min_blur': 0.0,
                'max_blur': 0.0
            }
        
        blur_scores = [score for _, score, _ in self.frames]
        return {
            'count': len(self.frames),
            'rejected': self.rejected_count,
            'avg_blur': sum(blur_scores) / len(blur_scores),
            'min_blur': min(blur_scores),
            'max_blur': max(blur_scores)
        }
    
    def set_capture_interval(self, interval: int):
        """Set the frame capture interval."""
        self.capture_interval = max(1, interval)
    
    def set_blur_threshold(self, threshold: float):
        """Set the blur quality threshold."""
        self.blur_threshold = threshold

