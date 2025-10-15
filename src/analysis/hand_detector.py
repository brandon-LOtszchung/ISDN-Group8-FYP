import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Tuple


class HandDetector:
    """Detects hands and analyzes hand state using MediaPipe."""
    
    def __init__(self, min_detection_confidence: float = 0.7, min_tracking_confidence: float = 0.5):
        """
        Args:
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
        """
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        self.last_detection_confidence = 0.0
        self.hand_count = 0
        self.hand_state = "UNKNOWN"
        self.last_finger_spread = 0.0
    
    def _analyze_hand_state(self, hand_landmarks) -> str:
        """
        Analyze if hand is empty or holding something based on finger spread.
        
        Args:
            hand_landmarks: MediaPipe hand landmarks
            
        Returns:
            "EMPTY" if fingers spread, "HOLDING" if grasping
        """
        landmarks = hand_landmarks.landmark
        
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        palm_base = landmarks[0]
        
        distances = []
        fingertips = [thumb_tip, index_tip, middle_tip, ring_tip, pinky_tip]
        
        for i in range(len(fingertips)):
            for j in range(i + 1, len(fingertips)):
                dist = np.sqrt(
                    (fingertips[i].x - fingertips[j].x) ** 2 +
                    (fingertips[i].y - fingertips[j].y) ** 2
                )
                distances.append(dist)
        
        avg_spread = np.mean(distances)
        self.last_finger_spread = avg_spread
        return "EMPTY" if avg_spread > 0.15 else "HOLDING"
    
    def get_hand_center_y(self, hand_landmarks, frame_height: int) -> float:
        """
        Get the Y position of hand center.
        
        Args:
            hand_landmarks: MediaPipe hand landmarks
            frame_height: Height of the frame
            
        Returns:
            Y position as fraction of frame height (0.0=top, 1.0=bottom)
        """
        landmarks = hand_landmarks.landmark
        palm_center = landmarks[9]
        return palm_center.y
    
    def detect(self, frame: np.ndarray) -> Tuple[bool, np.ndarray, int, str, float]:
        """
        Detect hands and analyze hand state.
        
        Args:
            frame: Input BGR image
            
        Returns:
            Tuple of (hand_detected, annotated_frame, hand_count, hand_state, hand_y_position)
        """
        if frame is None:
            return False, frame, 0, "UNKNOWN", 0.0
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        annotated_frame = frame.copy()
        hand_detected = False
        hand_count = 0
        hand_y = 0.0
        
        if results.multi_hand_landmarks:
            hand_detected = True
            hand_count = len(results.multi_hand_landmarks)
            
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    annotated_frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
            
            self.hand_state = self._analyze_hand_state(results.multi_hand_landmarks[0])
            hand_y = self.get_hand_center_y(results.multi_hand_landmarks[0], frame.shape[0])
            
            if results.multi_handedness:
                confidences = [hand.classification[0].score for hand in results.multi_handedness]
                self.last_detection_confidence = sum(confidences) / len(confidences)
        else:
            self.last_detection_confidence = 0.0
            self.hand_state = "UNKNOWN"
        
        self.hand_count = hand_count
        return hand_detected, annotated_frame, hand_count, self.hand_state, hand_y
    
    def get_confidence(self) -> float:
        """
        Returns:
            Detection confidence of last frame
        """
        return self.last_detection_confidence
    
    def get_hand_state(self) -> str:
        """
        Returns:
            Current hand state: "EMPTY", "HOLDING", or "UNKNOWN"
        """
        return self.hand_state
    
    def close(self):
        """Release resources."""
        self.hands.close()

