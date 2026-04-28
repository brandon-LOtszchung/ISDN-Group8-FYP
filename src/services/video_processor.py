import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Optional

class VideoProcessor:
    def __init__(self, red_line_ratio: float = 0.8, frame_skip: int = 2):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.red_line_ratio = red_line_ratio
        self.frame_skip = frame_skip

    def _detect_hand_and_wrist(self, frame: np.ndarray):
        """Single mediapipe pass returning (hand_pos, wrist_pos)."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)

        hand_pos = None
        wrist_pos = None

        if results.multi_hand_landmarks:
            hand = results.multi_hand_landmarks[0]
            h, w, _ = frame.shape
            wrist = hand.landmark[0]

            if 0 <= wrist.x <= 1 and 0 <= wrist.y <= 1:
                wrist_pos = (int(wrist.x * w), int(wrist.y * h))

            fingertip_indices = [4, 8, 12, 16, 20]
            avg_fingertip_y = sum(hand.landmark[i].y for i in fingertip_indices) / len(fingertip_indices)

            if wrist.y <= avg_fingertip_y:
                max_y = max(lm.y for lm in hand.landmark)
                avg_x = sum(lm.x for lm in hand.landmark) / len(hand.landmark)
                hand_pos = (int(avg_x * w), int(max_y * h))

        return hand_pos, wrist_pos

    def is_below_line(self, y_pos: int, frame_height: int) -> bool:
        red_line_y = int(frame_height * self.red_line_ratio)
        return y_pos > red_line_y

    def calculate_sharpness(self, frame: np.ndarray) -> float:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        return laplacian.var()

    def process_video(self, video_path: str) -> dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "No frames extracted"}

        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if frame_height == 0:
            cap.release()
            return {"error": "No frames extracted"}

        best_moment1 = None
        best_moment1_sharpness = -1
        best_moment2 = None
        best_moment2_sharpness = -1

        in_moment1 = False
        in_moment2 = False
        hand_crossed_down = False
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Skip frames to save CPU
            if frame_idx % self.frame_skip != 0:
                frame_idx += 1
                continue

            hand_pos, wrist_pos = self._detect_hand_and_wrist(frame)

            if hand_pos is None:
                if in_moment2:
                    frame_idx += 1
                    break
                frame_idx += 1
                continue

            if in_moment2:
                if wrist_pos is None:
                    frame_idx += 1
                    break

            x, y = hand_pos
            is_below = self.is_below_line(y, frame_height)

            if not in_moment1 and not hand_crossed_down:
                if wrist_pos is not None:
                    in_moment1 = True
                    sharpness = self.calculate_sharpness(frame)
                    if sharpness > best_moment1_sharpness:
                        best_moment1_sharpness = sharpness
                        best_moment1 = {"frame_index": frame_idx, "frame": frame.copy(), "sharpness": sharpness}
            elif in_moment1 and not hand_crossed_down:
                sharpness = self.calculate_sharpness(frame)
                if sharpness > best_moment1_sharpness:
                    best_moment1_sharpness = sharpness
                    best_moment1 = {"frame_index": frame_idx, "frame": frame.copy(), "sharpness": sharpness}
                if is_below:
                    hand_crossed_down = True
                    in_moment1 = False
            elif hand_crossed_down and not in_moment2:
                if not is_below:
                    in_moment2 = True
                    sharpness = self.calculate_sharpness(frame)
                    if sharpness > best_moment2_sharpness:
                        best_moment2_sharpness = sharpness
                        best_moment2 = {"frame_index": frame_idx, "frame": frame.copy(), "sharpness": sharpness}
            elif in_moment2:
                sharpness = self.calculate_sharpness(frame)
                if sharpness > best_moment2_sharpness:
                    best_moment2_sharpness = sharpness
                    best_moment2 = {"frame_index": frame_idx, "frame": frame.copy(), "sharpness": sharpness}

            frame_idx += 1

        cap.release()

        return {
            "moment1": best_moment1,
            "moment2": best_moment2
        }

    def __del__(self):
        self.hands.close()

