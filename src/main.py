import cv2
import numpy as np
import os
from datetime import datetime
from capture.camera_manager import CameraManager
from capture.frame_buffer import FrameBuffer
from analysis.blur_detector import BlurDetector
from analysis.hand_detector import HandDetector
from analysis.vision_analyzer import VisionAnalyzer
from inventory_manager import InventoryManager


class CaptureController:
    """Main controller using OpenCV display (more reliable on macOS)."""
    
    def __init__(self, capture_interval: int = 3, blur_threshold: float = 150.0, 
                 enable_hand_detection: bool = True, hand_absence_threshold: int = 15,
                 openai_api_key: str = None):
        """
        Args:
            capture_interval: Capture every N frames (lower = more frequent)
            blur_threshold: Minimum blur score to accept (higher = more strict)
            enable_hand_detection: Only capture when hand is detected
            hand_absence_threshold: Frames without hand to complete action (15 = ~0.5s at 30fps)
            openai_api_key: OpenAI API key for vision analysis
        """
        self.camera = CameraManager()
        self.buffer = FrameBuffer(capture_interval=capture_interval, blur_threshold=blur_threshold)
        self.blur_detector = BlurDetector()
        self.hand_detector = HandDetector() if enable_hand_detection else None
        self.vision_analyzer = VisionAnalyzer(openai_api_key) if openai_api_key else None
        self.inventory = InventoryManager()
        
        self.is_capturing = False
        self.show_best_frame = False
        self.browsing_frames = False
        self.latest_frame = None
        self.latest_annotated_frame = None
        self.best_frame_display = None
        self.current_browse_index = 0
        self.hand_detected = False
        self.hand_count = 0
        
        self.window_name = "Fridge Item Capture"
        self.output_dir = "captured_frames"
        
        self.capture_interval = capture_interval
        self.blur_threshold = blur_threshold
        self.enable_hand_detection = enable_hand_detection
        self.hand_absence_threshold = hand_absence_threshold
        
        self.action_in_progress = False
        self.frames_without_hand = 0
        self.action_count = 0
        self.last_zone = None
        self.action_phase = None
        self.initial_out_buffer = []
        self.exit_out_buffer = []
        self.action_images = []
        
        os.makedirs(self.output_dir, exist_ok=True)
    
    def on_new_frame(self, frame):
        """Handle each new frame from camera."""
        self.latest_frame = frame.copy()
        
        if self.hand_detector:
            self.hand_detected, self.latest_annotated_frame, self.hand_count, hand_state, hand_y = self.hand_detector.detect(frame)
        else:
            self.hand_detected = True
            self.latest_annotated_frame = frame.copy()
            self.hand_count = 0
            hand_state = "UNKNOWN"
            hand_y = 0.0
        
        if not self.is_capturing:
            return
        
        if self.hand_detected:
            self.frames_without_hand = 0
            
            current_zone = "IN" if hand_y > 0.5 else "OUT"
            
            if not self.action_in_progress and current_zone == "OUT":
                self.action_in_progress = True
                self.action_phase = "INITIAL_OUT"
                self.initial_out_buffer = []
                self.exit_out_buffer = []
                self.action_images = []
                self.last_zone = None
                self.action_count += 1
                print(f"\n>>> Action #{self.action_count} started - Phase: INITIAL_OUT")
            
            if self.action_in_progress:
                if self.action_phase == "INITIAL_OUT" and current_zone == "OUT":
                    blur_score = self.blur_detector.calculate_blur_score(frame)
                    if blur_score >= self.blur_threshold:
                        self.initial_out_buffer.append((frame.copy(), blur_score))
                        print(f"    [Buffering] Initial OUT frame: blur {blur_score:.2f} ({len(self.initial_out_buffer)} frames)")
                
                elif self.action_phase == "INITIAL_OUT" and current_zone == "IN" and self.last_zone == "OUT":
                    if self.initial_out_buffer:
                        best_frame, best_score = max(self.initial_out_buffer, key=lambda x: x[1])
                        self.action_images.append((best_frame, best_score, 1))
                        print(f"    ✓ Selected best from {len(self.initial_out_buffer)} frames → Image #1: blur {best_score:.2f}")
                    else:
                        print(f"    ✗ No acceptable frames in initial OUT zone")
                    self.action_phase = "IN_ZONE"
                    print(f"    Phase: IN_ZONE")
                
                elif self.action_phase == "IN_ZONE" and current_zone == "IN":
                    pass
                
                elif self.action_phase == "IN_ZONE" and current_zone == "OUT" and self.last_zone == "IN":
                    self.action_phase = "EXIT_OUT"
                    self.exit_out_buffer = []
                    print(f"    Phase: EXIT_OUT")
                
                elif self.action_phase == "EXIT_OUT" and current_zone == "OUT":
                    blur_score = self.blur_detector.calculate_blur_score(frame)
                    if blur_score >= self.blur_threshold:
                        self.exit_out_buffer.append((frame.copy(), blur_score))
                        print(f"    [Buffering] Exit OUT frame: blur {blur_score:.2f} ({len(self.exit_out_buffer)} frames)")
            
            self.last_zone = current_zone
        else:
            self.frames_without_hand += 1
            
            if self.action_in_progress and self.frames_without_hand >= self.hand_absence_threshold:
                self._complete_action()
    
    def _determine_direction(self) -> str:
        """
        Determine direction based on number of IN-zone captures.
        
        Returns:
            Direction string
        """
        if len(self.action_images) == 2:
            return "IN"
        elif len(self.action_images) == 1:
            return "OUT"
        else:
            return "UNKNOWN"
    
    def _complete_action(self):
        """Complete the current action and save best images from each OUT window."""
        if self.action_phase == "EXIT_OUT" and self.exit_out_buffer:
            best_frame, best_score = max(self.exit_out_buffer, key=lambda x: x[1])
            self.action_images.append((best_frame, best_score, 2))
            print(f"    ✓ Selected best from {len(self.exit_out_buffer)} exit frames → Image #2: blur {best_score:.2f}")
        
        if not self.action_images:
            print(f"    Action #{self.action_count} completed: No images captured")
            self.action_in_progress = False
            self.frames_without_hand = 0
            return
        
        if self.vision_analyzer and len(self.action_images) == 2:
            print(f"\n    Analyzing with GPT-4o Vision...")
            inventory_list = self.inventory.get_inventory_list()
            
            before_analysis = self.vision_analyzer.analyze_hand_content(
                self.action_images[0][0], 
                inventory_context=inventory_list
            )
            print(f"      Before: {before_analysis['description']}")
            
            after_analysis = self.vision_analyzer.analyze_hand_content(
                self.action_images[1][0],
                inventory_context=inventory_list
            )
            print(f"      After: {after_analysis['description']}")
            
            action_result = self.vision_analyzer.compare_and_determine_action(before_analysis, after_analysis)
            direction = action_result["action"]
            
            if direction == "PLACED" and action_result.get("items"):
                for item in action_result["items"]:
                    self.inventory.add_item(item, 1)
                print(f"\n    ✓ DETECTED: {action_result['description']}")
                print(f"    → Inventory updated: {self.inventory.get_inventory_list()}")
            elif direction == "REMOVED" and action_result.get("items"):
                for item in action_result["items"]:
                    self.inventory.remove_item(item, 1)
                print(f"\n    ✓ DETECTED: {action_result['description']}")
                print(f"    → Inventory updated: {self.inventory.get_inventory_list()}")
            else:
                print(f"\n    ✓ DETECTED: {action_result['description']}")
        else:
            direction = self._determine_direction()
        
        direction_text = {"PLACED": "PLACED", "REMOVED": "REMOVED", "SWAPPED": "SWAPPED", 
                         "IN": "PLACED", "OUT": "REMOVED", "UNKNOWN": "INCOMPLETE", "UNCLEAR": "UNCLEAR"}[direction]
        
        for frame, blur_score, img_num in self.action_images:
            self.buffer.frames.append((frame, blur_score, direction))
        
        print(f"\n    Action #{self.action_count} COMPLETED: {direction_text} ({len(self.action_images)} images)")
        for frame, blur_score, img_num in self.action_images:
            print(f"      OUT-zone image {img_num}: blur {blur_score:.2f}")
        
        self.action_in_progress = False
        self.frames_without_hand = 0
        self.action_phase = None
        self.initial_out_buffer = []
        self.exit_out_buffer = []
        self.action_images = []
    
    def on_trigger(self):
        """Start capturing actions."""
        self.is_capturing = True
        self.show_best_frame = False
        self.browsing_frames = False
        self.buffer.clear()
        self.action_in_progress = False
        self.frames_without_hand = 0
        self.action_images = []
        self.action_count = 0
        self.last_zone = None
        self.action_phase = None
        self.initial_out_buffer = []
        self.exit_out_buffer = []
        print("\n>>> Started capturing - waiting for hand in OUT zone...")
    
    def on_untrigger(self):
        """Stop capturing and show results."""
        if self.action_in_progress:
            self._complete_action()
        
        self.is_capturing = False
        best_frame, blur_score, direction = self.buffer.get_best_frame()
        
        if best_frame is not None:
            self.show_best_frame = True
            self.best_frame_display = best_frame
            self.current_browse_index = 0
            stats = self.buffer.get_statistics()
            print(f"\n>>> Stopped capturing")
            print(f"    Total actions: {self.action_count}")
            print(f"    Saved frames: {self.buffer.get_frame_count()}")
            print(f"    Best blur score: {blur_score:.2f}")
            print(f"    Average blur: {stats['avg_blur']:.1f}")
        else:
            self.show_best_frame = False
            print("\n>>> No frames captured")
    
    def add_text_to_frame(self, frame, blur_score=None, frame_index=None, direction=None):
        """Add status text overlay to frame."""
        display_frame = frame.copy()
        
        # Draw horizontal divider line (IN/OUT boundary)
        height, width = display_frame.shape[:2]
        mid_y = height // 2
        
        # Draw the line
        cv2.line(display_frame, (0, mid_y), (width, mid_y), (0, 255, 255), 3)
        
        # Add "OUT" label (top half)
        cv2.putText(display_frame, "OUT", (width - 100, mid_y - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 100, 255), 3)
        cv2.putText(display_frame, "(Items removed)", (width - 270, mid_y - 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 100, 255), 2)
        
        # Add "IN" label (bottom half)
        cv2.putText(display_frame, "IN", (width - 80, mid_y + 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        cv2.putText(display_frame, "(Items placed)", (width - 250, mid_y + 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Add semi-transparent overlay for text background (top left corner)
        overlay = display_frame.copy()
        cv2.rectangle(overlay, (10, 10), (700, 210), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.3, display_frame, 0.7, 0, display_frame)
        
        if self.enable_hand_detection:
            hand_status = f"Hand: {'DETECTED' if self.hand_detected else 'Not detected'}"
            hand_color = (0, 255, 0) if self.hand_detected else (100, 100, 100)
            cv2.putText(display_frame, hand_status, (20, 170), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, hand_color, 2)
            if self.hand_count > 0:
                cv2.putText(display_frame, f"({self.hand_count} hand{'s' if self.hand_count > 1 else ''})", 
                           (250, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.5, hand_color, 1)
        
        if self.is_capturing:
            status = f"Status: CAPTURING - Press 'S' to stop"
            cv2.putText(display_frame, status, (20, 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            action_status = f"Action: {'IN PROGRESS' if self.action_in_progress else 'Waiting for hand'}"
            action_color = (0, 255, 255) if self.action_in_progress else (100, 100, 100)
            cv2.putText(display_frame, action_status, (20, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, action_color, 1)
            
            cv2.putText(display_frame, f"Actions: {self.action_count} | Saved: {self.buffer.get_frame_count()}", 
                       (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            if self.action_in_progress:
                buffer_size = len(self.initial_out_buffer) if self.action_phase == "INITIAL_OUT" else len(self.exit_out_buffer)
                cv2.putText(display_frame, f"Phase: {self.action_phase} | Buffer: {buffer_size} frames", 
                           (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            cv2.putText(display_frame, "Press 'S' to stop and review captured frames", 
                       (20, height - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        elif self.browsing_frames:
            status = "Status: BROWSING - Arrow keys to navigate"
            cv2.putText(display_frame, status, (20, 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
            if blur_score is not None and frame_index is not None:
                cv2.putText(display_frame, f"Frame {frame_index + 1}/{self.buffer.get_frame_count()} - Blur Score: {blur_score:.2f}", 
                           (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                # Show if this is the best frame
                best_frame, best_score, _ = self.buffer.get_best_frame()
                if abs(blur_score - best_score) < 0.01:
                    cv2.putText(display_frame, ">>> BEST FRAME <<<", 
                               (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(display_frame, "Press 'C' to return to live view", 
                       (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        elif self.show_best_frame:
            direction_text = {"IN": "PLACED", "OUT": "REMOVED", "UNKNOWN": "UNCLEAR"}.get(direction, "")
            direction_color = {"IN": (0, 255, 0), "OUT": (0, 165, 255), "UNKNOWN": (128, 128, 128)}.get(direction, (255, 255, 255))
            
            status = f"Status: Review Mode | {direction_text}"
            cv2.putText(display_frame, status, (20, 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, direction_color, 2)
            if blur_score is not None:
                cv2.putText(display_frame, f"Blur Score: {blur_score:.2f}", 
                           (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            stats = self.buffer.get_statistics()
            cv2.putText(display_frame, f"Total images: {stats['count']} from {self.action_count} actions", 
                       (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(display_frame, "Press 'B' to browse by action | 'V' to save | 'C' for live view", 
                       (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        else:
            status = "Status: LIVE - Press 'C' to start capture"
            cv2.putText(display_frame, status, (20, 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            if self.enable_hand_detection and self.hand_detected:
                cv2.putText(display_frame, "Ready to capture when triggered!", 
                           (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
            
            cv2.putText(display_frame, "Keys: C=Start | S=Stop | T=Top5 | B=Browse | V=Save | Q=Quit", 
                       (20, height - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        return display_frame
    
    def save_captured_frames(self):
        """Save all captured frames to disk with timestamps and blur scores."""
        if self.buffer.get_frame_count() == 0:
            print("No frames to save")
            return
        
        # Create timestamped session folder
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_dir = os.path.join(self.output_dir, f"session_{timestamp}")
        top_dir = os.path.join(session_dir, "top_5")
        all_dir = os.path.join(session_dir, "all_frames")
        os.makedirs(top_dir, exist_ok=True)
        os.makedirs(all_dir, exist_ok=True)
        
        stats = self.buffer.get_statistics()
        print(f"\nSaving {stats['count']} frames ({stats['rejected']} rejected) to {session_dir}/")
        
        # Save top 5 frames in dedicated folder
        top_frames = self.buffer.get_top_frames(5)
        for i, (frame, blur_score) in enumerate(top_frames):
            filename = f"TOP{i+1}_blur_{blur_score:.2f}.jpg"
            filepath = os.path.join(top_dir, filename)
            cv2.imwrite(filepath, frame)
        
        # Save all frames
        for i, (frame, blur_score) in enumerate(self.buffer.frames):
            filename = f"frame_{i+1:03d}_blur_{blur_score:.2f}.jpg"
            filepath = os.path.join(all_dir, filename)
            cv2.imwrite(filepath, frame)
        
        print(f"✓ Saved {len(top_frames)} top frames to {top_dir}/")
        print(f"✓ Saved all {stats['count']} frames to {all_dir}/")
        print(f"  Quality: avg={stats['avg_blur']:.1f}, range={stats['min_blur']:.1f}-{stats['max_blur']:.1f}")
    
    def show_top_frames_grid(self):
        """Display top 5 frames in a grid."""
        top_frames = self.buffer.get_top_frames(5)
        if not top_frames:
            print("No frames to display")
            return
        
        # Create grid layout (2x3 or adjust based on count)
        grid_rows = 2
        grid_cols = 3
        cell_width = 640
        cell_height = 480
        
        grid = np.zeros((grid_rows * cell_height, grid_cols * cell_width, 3), dtype=np.uint8)
        
        for idx, (frame, blur_score) in enumerate(top_frames):
            if idx >= 5:
                break
            
            row = idx // grid_cols
            col = idx % grid_cols
            
            # Resize frame to fit cell
            resized = cv2.resize(frame, (cell_width, cell_height))
            
            # Add ranking and score
            cv2.putText(resized, f"#{idx + 1}", (20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            cv2.putText(resized, f"Blur: {blur_score:.1f}", (20, 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # Place in grid
            y_start = row * cell_height
            x_start = col * cell_width
            grid[y_start:y_start + cell_height, x_start:x_start + cell_width] = resized
        
        # Add instructions
        cv2.putText(grid, "Top 5 Actions - Press 'C' to return", (20, grid.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        cv2.namedWindow("Top 5 Frames", cv2.WINDOW_NORMAL)
        cv2.imshow("Top 5 Frames", grid)
        
        # Wait for keypress
        while True:
            key = cv2.waitKey(1) & 0xFF
            if key == ord('c') or key == ord('C') or key == ord('q'):
                cv2.destroyWindow("Top 5 Frames")
                break
    
    def start(self):
        print("\n=== Fridge Item Capture System ===")
        print(f"Configuration:")
        print(f"  Capture interval: Every {self.capture_interval} frames")
        print(f"  Blur threshold: {self.blur_threshold:.0f}")
        print(f"  Hand detection: {'ENABLED' if self.enable_hand_detection else 'DISABLED'}")
        print(f"  Hand absence threshold: {self.hand_absence_threshold} frames (~{self.hand_absence_threshold/30:.1f}s)")
        print("\nAction-based capture: One best frame per item placement")
        print("\nControls:")
        print("  C - Start capturing | S - Stop and review")
        print("  T - Top 5 frames | B - Browse all | V - Save")
        print("  Q - Quit")
        print("="*50 + "\n")
        
        if not self.camera.start():
            print("Error: Could not open camera")
            return
        
        self.camera.set_frame_callback(self.on_new_frame)
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.window_name, 1280, 720)
        
        # Main display loop
        while True:
            if self.browsing_frames and self.buffer.get_frame_count() > 0:
                # Show current frame in browse mode
                frame, blur_score, direction = self.buffer.frames[self.current_browse_index]
                display_frame = self.add_text_to_frame(frame, blur_score, self.current_browse_index, direction)
            elif self.show_best_frame and self.best_frame_display is not None:
                # Show the best frame
                best_frame, blur_score, direction = self.buffer.get_best_frame()
                display_frame = self.add_text_to_frame(self.best_frame_display, blur_score, None, direction)
            elif self.latest_annotated_frame is not None:
                # Show live feed with hand detection annotations
                display_frame = self.add_text_to_frame(self.latest_annotated_frame)
            else:
                # No frame yet, show black screen
                display_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(display_frame, "Initializing camera...", (150, 240),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow(self.window_name, display_frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q') or key == ord('Q'):
                break
            elif key == ord('c') or key == ord('C'):
                if not self.is_capturing and not self.show_best_frame and not self.browsing_frames:
                    self.on_trigger()
                else:
                    self.is_capturing = False
                    self.show_best_frame = False
                    self.browsing_frames = False
                    self.best_frame_display = None
                    print("\n>>> Returned to live view")
            elif key == ord('s') or key == ord('S'):
                if self.is_capturing:
                    self.on_untrigger()
            elif key == ord('t') or key == ord('T'):
                if self.show_best_frame and self.buffer.get_frame_count() > 0:
                    # Show top frames grid
                    self.show_top_frames_grid()
            elif key == ord('b') or key == ord('B'):
                if self.show_best_frame and self.buffer.get_frame_count() > 0:
                    # Enter browse mode
                    self.browsing_frames = True
                    self.show_best_frame = False
                    self.current_browse_index = 0
                    print(f"\n>>> Browsing {self.buffer.get_frame_count()} captured frames")
                    print("    Use arrow keys (← →) to navigate")
            elif key == ord('v') or key == ord('V'):
                if self.buffer.get_frame_count() > 0:
                    self.save_captured_frames()
            elif key == 81 or key == 2:  # Left arrow
                if self.browsing_frames and self.buffer.get_frame_count() > 0:
                    self.current_browse_index = (self.current_browse_index - 1) % self.buffer.get_frame_count()
            elif key == 83 or key == 3:  # Right arrow
                if self.browsing_frames and self.buffer.get_frame_count() > 0:
                    self.current_browse_index = (self.current_browse_index + 1) % self.buffer.get_frame_count()
        
        # Cleanup
        self.camera.stop()
        if self.hand_detector:
            self.hand_detector.close()
        cv2.destroyAllWindows()
        print("\nApplication closed.")


def main():
    CAPTURE_INTERVAL = 1
    BLUR_THRESHOLD = 35.0
    ENABLE_HAND_DETECTION = True
    HAND_ABSENCE_THRESHOLD = 15
    OPENAI_API_KEY = ""
    
    controller = CaptureController(
        capture_interval=CAPTURE_INTERVAL,
        blur_threshold=BLUR_THRESHOLD,
        enable_hand_detection=ENABLE_HAND_DETECTION,
        hand_absence_threshold=HAND_ABSENCE_THRESHOLD,
        openai_api_key=OPENAI_API_KEY
    )
    controller.start()


if __name__ == "__main__":
    main()

