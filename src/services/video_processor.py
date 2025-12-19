import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Optional

class VideoProcessor:
    def __init__(self, red_line_ratio: float = 0.8):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.red_line_ratio = red_line_ratio
    
    def extract_frames(self, video_path: str) -> List[Tuple[int, np.ndarray]]:
        cap = cv2.VideoCapture(video_path)
        frames = []
        frame_idx = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append((frame_idx, frame))
            frame_idx += 1
        
        cap.release()
        return frames
    
    def detect_hand(self, frame: np.ndarray) -> Optional[Tuple[int, int]]:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            hand = results.multi_hand_landmarks[0]
            h, w, _ = frame.shape
            
            wrist_y = hand.landmark[0].y
            fingertip_indices = [4, 8, 12, 16, 20]
            avg_fingertip_y = sum(hand.landmark[i].y for i in fingertip_indices) / len(fingertip_indices)
            
            if wrist_y > avg_fingertip_y:
                return None
            
            max_y = max(landmark.y for landmark in hand.landmark)
            avg_x = sum(landmark.x for landmark in hand.landmark) / len(hand.landmark)
            
            return (int(avg_x * w), int(max_y * h))
        return None
    
    def get_wrist_position(self, frame: np.ndarray) -> Optional[Tuple[int, int]]:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            hand = results.multi_hand_landmarks[0]
            wrist = hand.landmark[0]
            h, w, _ = frame.shape
            
            if wrist.y < 0 or wrist.y > 1 or wrist.x < 0 or wrist.x > 1:
                return None
            
            return (int(wrist.x * w), int(wrist.y * h))
        return None
    
    def is_below_line(self, y_pos: int, frame_height: int) -> bool:
        red_line_y = int(frame_height * self.red_line_ratio)
        return y_pos > red_line_y
    
    def calculate_sharpness(self, frame: np.ndarray) -> float:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        return laplacian.var()
    
    def process_video(self, video_path: str) -> dict:
        frames = self.extract_frames(video_path)
        if not frames:
            return {"error": "No frames extracted"}
        
        _, first_frame = frames[0]
        frame_height = first_frame.shape[0]
        
        moment1_frames = []
        moment2_frames = []
        
        in_moment1 = False
        in_moment2 = False
        hand_crossed_down = False
        
        for frame_idx, frame in frames:
            hand_pos = self.detect_hand(frame)
            wrist_pos = self.get_wrist_position(frame)
            has_hand = hand_pos is not None
            
            if hand_pos is None:
                if in_moment1 and not hand_crossed_down:
                    moment1_frames.append((frame_idx, frame, False))
                    in_moment1 = True
                elif in_moment2:
                    break
                continue
            
            if in_moment2:
                if wrist_pos is None:
                    break
            
            x, y = hand_pos
            is_below = self.is_below_line(y, frame_height)
            
            if not in_moment1 and not hand_crossed_down:
                if wrist_pos is not None:
                    in_moment1 = True
                    moment1_frames.append((frame_idx, frame, True))
            elif in_moment1 and not hand_crossed_down:
                moment1_frames.append((frame_idx, frame, True))
                if is_below:
                    hand_crossed_down = True
                    in_moment1 = False
            elif hand_crossed_down and not in_moment2:
                if not is_below:
                    in_moment2 = True
                    moment2_frames.append((frame_idx, frame, True))
            elif in_moment2:
                moment2_frames.append((frame_idx, frame, True))
        
        best_moment1 = self._get_clearest_frame(moment1_frames)
        best_moment2 = self._get_clearest_frame(moment2_frames)
        
        return {
            "moment1": best_moment1,
            "moment2": best_moment2
        }
    
    def _get_clearest_frame(self, frames: List[Tuple[int, np.ndarray, bool]]) -> Optional[dict]:
        if not frames:
            return None
        
        frames_with_hand = [(idx, frame) for idx, frame, has_hand in frames if has_hand]
        
        if not frames_with_hand:
            return None
        
        best_frame = None
        best_sharpness = -1
        best_idx = -1
        
        for frame_idx, frame in frames_with_hand:
            sharpness = self.calculate_sharpness(frame)
            if sharpness > best_sharpness:
                best_sharpness = sharpness
                best_frame = frame
                best_idx = frame_idx
        
        return {
            "frame_index": best_idx,
            "frame": best_frame,
            "sharpness": best_sharpness
        }
    
    def __del__(self):
        self.hands.close()

