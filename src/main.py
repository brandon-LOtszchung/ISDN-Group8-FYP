"""Main controller for Fridge Item Tracking System."""
import cv2
import numpy as np
import os
import logging
from datetime import datetime
from typing import Optional, Tuple

from capture.camera_manager import CameraManager
from capture.frame_buffer import FrameBuffer
from analysis.blur_detector import BlurDetector
from analysis.hand_detector import HandDetector
from analysis.vision_analyzer import VisionAnalyzer
from inventory_manager import InventoryManager
from config import AppConfig
from utils.logger import setup_logger


class CaptureController:
    """Main controller for the fridge item tracking system."""
    
    def __init__(self, config: AppConfig):
        """
        Initialize the capture controller with configuration.
        
        Args:
            config: Application configuration object
        """
        self.config = config
        self.logger = logging.getLogger("FridgeTracker.Controller")
        
        # Initialize components
        self.camera = CameraManager(
            camera_index=config.camera.index,
            camera_url=config.camera.url if config.camera.url else None
        )
        self.buffer = FrameBuffer(
            capture_interval=config.capture.capture_interval,
            blur_threshold=config.capture.blur_threshold
        )
        self.blur_detector = BlurDetector()
        
        # Initialize hand detector if enabled
        self.hand_detector = None
        if config.capture.enable_hand_detection:
            self.hand_detector = HandDetector(
                min_detection_confidence=config.hand_detection.min_detection_confidence,
                min_tracking_confidence=config.hand_detection.min_tracking_confidence
            )
        
        # Initialize vision analyzer if API key is provided
        self.vision_analyzer = None
        if config.vision_api.api_key:
            try:
                self.vision_analyzer = VisionAnalyzer(
                    api_key=config.vision_api.api_key,
                    model=config.vision_api.model,
                    max_tokens=config.vision_api.max_tokens,
                    temperature=config.vision_api.temperature,
                    retry_attempts=config.vision_api.retry_attempts,
                    retry_delay=config.vision_api.retry_delay
                )
                self.logger.info("Vision analyzer initialized successfully")
            except Exception as e:
                self.logger.error(f"Failed to initialize vision analyzer: {e}")
                self.vision_analyzer = None
        
        # Initialize inventory manager
        inventory_path = os.path.join(config.storage.output_dir, config.storage.inventory_file)
        self.inventory = InventoryManager(inventory_file=inventory_path)
        
        # UI state
        self.is_capturing = False
        self.show_best_frame = False
        self.browsing_frames = False
        self.latest_frame: Optional[np.ndarray] = None
        self.latest_annotated_frame: Optional[np.ndarray] = None
        self.best_frame_display: Optional[np.ndarray] = None
        self.current_browse_index = 0
        self.hand_detected = False
        self.hand_count = 0
        
        # Capture state
        self.action_in_progress = False
        self.frames_without_hand = 0
        self.action_count = 0
        self.last_zone: Optional[str] = None
        self.action_phase: Optional[str] = None
        self.initial_out_buffer = []
        self.exit_out_buffer = []
        self.action_images = []
        
        # Window configuration
        self.window_name = "Fridge Item Capture System"
        self.output_dir = config.storage.output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.logger.info("Capture controller initialized")
    
    def on_new_frame(self, frame: np.ndarray):
        """
        Handle each new frame from camera.
        
        Args:
            frame: Frame from camera
        """
        self.latest_frame = frame.copy()
        
        # Detect hands if enabled
        if self.hand_detector:
            self.hand_detected, self.latest_annotated_frame, self.hand_count, hand_state, hand_y = \
                self.hand_detector.detect(frame)
        else:
            self.hand_detected = True
            self.latest_annotated_frame = frame.copy()
            self.hand_count = 0
            hand_state = "UNKNOWN"
            hand_y = 0.0
        
        if not self.is_capturing:
            return
        
        # Process hand detection for action tracking
        if self.hand_detected:
            self.frames_without_hand = 0
            current_zone = "IN" if hand_y > 0.5 else "OUT"
            
            # Start new action when hand appears in OUT zone
            if not self.action_in_progress and current_zone == "OUT":
                self._start_new_action()
            
            # Process action phases
            if self.action_in_progress:
                self._process_action_phase(frame, current_zone)
            
            self.last_zone = current_zone
        else:
            self.frames_without_hand += 1
            
            # Complete action when hand is absent for threshold frames
            if self.action_in_progress and self.frames_without_hand >= self.config.capture.hand_absence_threshold:
                self._complete_action()
    
    def _start_new_action(self):
        """Start a new action capture."""
        self.action_in_progress = True
        self.action_phase = "INITIAL_OUT"
        self.initial_out_buffer = []
        self.exit_out_buffer = []
        self.action_images = []
        self.last_zone = None
        self.action_count += 1
        self.logger.info(f"Action #{self.action_count} started - Phase: INITIAL_OUT")
    
    def _process_action_phase(self, frame: np.ndarray, current_zone: str):
        """
        Process the current action phase.
        
        Args:
            frame: Current frame
            current_zone: Current hand zone (IN or OUT)
        """
        blur_score = self.blur_detector.calculate_blur_score(frame)
        
        # Phase 1: Initial OUT zone (before fridge)
        if self.action_phase == "INITIAL_OUT" and current_zone == "OUT":
            if blur_score >= self.config.capture.blur_threshold:
                self.initial_out_buffer.append((frame.copy(), blur_score))
                self.logger.debug(f"Buffering initial OUT frame: blur {blur_score:.2f} ({len(self.initial_out_buffer)} frames)")
        
        # Transition from OUT to IN
        elif self.action_phase == "INITIAL_OUT" and current_zone == "IN" and self.last_zone == "OUT":
            if self.initial_out_buffer:
                best_frame, best_score = max(self.initial_out_buffer, key=lambda x: x[1])
                self.action_images.append((best_frame, best_score, 1))
                self.logger.info(f"Selected best from {len(self.initial_out_buffer)} frames → Image #1: blur {best_score:.2f}")
            else:
                self.logger.warning("No acceptable frames in initial OUT zone")
            self.action_phase = "IN_ZONE"
            self.logger.debug("Phase: IN_ZONE")
        
        # Phase 2: IN zone (inside fridge) - just tracking
        elif self.action_phase == "IN_ZONE" and current_zone == "IN":
            pass
        
        # Transition from IN to OUT
        elif self.action_phase == "IN_ZONE" and current_zone == "OUT" and self.last_zone == "IN":
            self.action_phase = "EXIT_OUT"
            self.exit_out_buffer = []
            self.logger.debug("Phase: EXIT_OUT")
        
        # Phase 3: Exit OUT zone (after fridge)
        elif self.action_phase == "EXIT_OUT" and current_zone == "OUT":
            if blur_score >= self.config.capture.blur_threshold:
                self.exit_out_buffer.append((frame.copy(), blur_score))
                self.logger.debug(f"Buffering exit OUT frame: blur {blur_score:.2f} ({len(self.exit_out_buffer)} frames)")
    
    def _complete_action(self):
        """Complete the current action and analyze with Vision API."""
        # Select best frame from exit buffer
        if self.action_phase == "EXIT_OUT" and self.exit_out_buffer:
            best_frame, best_score = max(self.exit_out_buffer, key=lambda x: x[1])
            self.action_images.append((best_frame, best_score, 2))
            self.logger.info(f"Selected best from {len(self.exit_out_buffer)} exit frames → Image #2: blur {best_score:.2f}")
        
        if not self.action_images:
            self.logger.warning(f"Action #{self.action_count} completed with no images captured")
            self._reset_action_state()
            return
        
        # Analyze with Vision API if available
        if self.vision_analyzer and len(self.action_images) == 2:
            self._analyze_with_vision_api()
        else:
            direction = self._determine_direction_simple()
            self.logger.info(f"Action #{self.action_count} completed: {direction} (Vision API not available)")
        
        # Save frames to buffer
        for frame, blur_score, img_num in self.action_images:
            direction = getattr(self, '_last_direction', "UNKNOWN")
            self.buffer.frames.append((frame, blur_score, direction))
        
        self.logger.info(f"Action #{self.action_count} COMPLETED ({len(self.action_images)} images)")
        self._reset_action_state()
    
    def _analyze_with_vision_api(self):
        """Analyze captured images with Vision API and update inventory."""
        self.logger.info("Analyzing with GPT-4o Vision...")
        inventory_list = self.inventory.get_inventory_list()
        
        # Analyze before image
        before_analysis = self.vision_analyzer.analyze_hand_content(
            self.action_images[0][0],
            inventory_context=inventory_list
        )
        self.logger.info(f"Before: {before_analysis['description']}")
        
        # Analyze after image
        after_analysis = self.vision_analyzer.analyze_hand_content(
            self.action_images[1][0],
            inventory_context=inventory_list
        )
        self.logger.info(f"After: {after_analysis['description']}")
        
        # Determine action and update inventory
        action_result = self.vision_analyzer.compare_and_determine_action(before_analysis, after_analysis)
        direction = action_result["action"]
        self._last_direction = direction
        
        if direction == "PLACED" and action_result.get("items"):
            for item in action_result["items"]:
                self.inventory.add_item(item, 1)
            self.logger.info(f"DETECTED: {action_result['description']}")
            self.logger.info(f"Inventory updated: {self.inventory.get_inventory_list()}")
        
        elif direction == "REMOVED" and action_result.get("items"):
            for item in action_result["items"]:
                self.inventory.remove_item(item, 1)
            self.logger.info(f"DETECTED: {action_result['description']}")
            self.logger.info(f"Inventory updated: {self.inventory.get_inventory_list()}")
        
        else:
            self.logger.info(f"DETECTED: {action_result['description']}")
    
    def _determine_direction_simple(self) -> str:
        """Simple direction determination without Vision API."""
        if len(self.action_images) == 2:
            return "PLACED"
        elif len(self.action_images) == 1:
            return "REMOVED"
        else:
            return "UNKNOWN"
    
    def _reset_action_state(self):
        """Reset action capture state."""
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
        self._reset_action_state()
        self.action_count = 0
        self.last_zone = None
        self.logger.info("Started capturing - waiting for hand in OUT zone...")
    
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
            self.logger.info(f"Stopped capturing - Actions: {self.action_count}, Frames: {self.buffer.get_frame_count()}")
            self.logger.info(f"Best blur score: {blur_score:.2f}, Avg: {stats['avg_blur']:.1f}")
        else:
            self.show_best_frame = False
            self.logger.info("No frames captured")
    
    def add_text_to_frame(self, frame: np.ndarray, blur_score: Optional[float] = None, 
                         frame_index: Optional[int] = None, direction: Optional[str] = None) -> np.ndarray:
        """
        Add status overlay to frame.
        
        Args:
            frame: Input frame
            blur_score: Optional blur score to display
            frame_index: Optional frame index
            direction: Optional action direction
            
        Returns:
            Frame with overlay
        """
        display_frame = frame.copy()
        height, width = display_frame.shape[:2]
        mid_y = height // 2
        
        # Draw zone divider line
        cv2.line(display_frame, (0, mid_y), (width, mid_y), (0, 255, 255), 3)
        
        # Add zone labels
        cv2.putText(display_frame, "OUT", (width - 100, mid_y - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 100, 255), 3)
        cv2.putText(display_frame, "(Items removed)", (width - 270, mid_y - 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 100, 255), 2)
        
        cv2.putText(display_frame, "IN", (width - 80, mid_y + 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        cv2.putText(display_frame, "(Items placed)", (width - 250, mid_y + 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Add status overlay
        overlay = display_frame.copy()
        cv2.rectangle(overlay, (10, 10), (700, 210), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.3, display_frame, 0.7, 0, display_frame)
        
        # Hand detection status
        if self.config.capture.enable_hand_detection:
            hand_status = f"Hand: {'DETECTED' if self.hand_detected else 'Not detected'}"
            hand_color = (0, 255, 0) if self.hand_detected else (100, 100, 100)
            cv2.putText(display_frame, hand_status, (20, 170), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, hand_color, 2)
        
        # Mode-specific overlays
        if self.is_capturing:
            self._add_capturing_overlay(display_frame, height)
        elif self.browsing_frames:
            self._add_browsing_overlay(display_frame, blur_score, frame_index)
        elif self.show_best_frame:
            self._add_review_overlay(display_frame, blur_score, direction)
        else:
            self._add_live_overlay(display_frame, height)
        
        return display_frame
    
    def _add_capturing_overlay(self, frame: np.ndarray, height: int):
        """Add overlay for capturing mode."""
        cv2.putText(frame, "Status: CAPTURING - Press 'S' to stop", (20, 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        action_status = f"Action: {'IN PROGRESS' if self.action_in_progress else 'Waiting'}"
        action_color = (0, 255, 255) if self.action_in_progress else (100, 100, 100)
        cv2.putText(frame, action_status, (20, 70), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, action_color, 1)
        
        cv2.putText(frame, f"Actions: {self.action_count} | Saved: {self.buffer.get_frame_count()}", 
                   (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        if self.action_in_progress:
            buffer_size = len(self.initial_out_buffer) if self.action_phase == "INITIAL_OUT" else len(self.exit_out_buffer)
            cv2.putText(frame, f"Phase: {self.action_phase} | Buffer: {buffer_size} frames", 
                       (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    def _add_browsing_overlay(self, frame: np.ndarray, blur_score: Optional[float], frame_index: Optional[int]):
        """Add overlay for browsing mode."""
        cv2.putText(frame, "Status: BROWSING - Arrow keys to navigate", (20, 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
        
        if blur_score is not None and frame_index is not None:
            cv2.putText(frame, f"Frame {frame_index + 1}/{self.buffer.get_frame_count()} - Blur: {blur_score:.2f}", 
                       (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    def _add_review_overlay(self, frame: np.ndarray, blur_score: Optional[float], direction: Optional[str]):
        """Add overlay for review mode."""
        direction_text = {"PLACED": "PLACED", "REMOVED": "REMOVED", "UNKNOWN": "UNCLEAR"}.get(direction, "")
        direction_color = {"PLACED": (0, 255, 0), "REMOVED": (0, 165, 255), "UNKNOWN": (128, 128, 128)}.get(direction, (255, 255, 255))
        
        cv2.putText(frame, f"Status: Review Mode | {direction_text}", (20, 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, direction_color, 2)
        
        if blur_score is not None:
            cv2.putText(frame, f"Blur Score: {blur_score:.2f}", (20, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        stats = self.buffer.get_statistics()
        cv2.putText(frame, f"Total images: {stats['count']} from {self.action_count} actions", 
                   (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    def _add_live_overlay(self, frame: np.ndarray, height: int):
        """Add overlay for live mode."""
        cv2.putText(frame, "Status: LIVE - Press 'C' to start capture", (20, 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        cv2.putText(frame, "Keys: C=Start | S=Stop | T=Top5 | B=Browse | V=Save | Q=Quit", 
                   (20, height - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    def save_captured_frames(self):
        """Save all captured frames to disk."""
        if self.buffer.get_frame_count() == 0:
            self.logger.warning("No frames to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_dir = os.path.join(self.output_dir, f"session_{timestamp}")
        top_dir = os.path.join(session_dir, "top_5")
        all_dir = os.path.join(session_dir, "all_frames")
        os.makedirs(top_dir, exist_ok=True)
        os.makedirs(all_dir, exist_ok=True)
        
        stats = self.buffer.get_statistics()
        self.logger.info(f"Saving {stats['count']} frames to {session_dir}/")
        
        # Save top 5 frames
        top_frames = self.buffer.get_top_frames(5)
        for i, (frame, blur_score, direction) in enumerate(top_frames):
            filename = f"TOP{i+1}_{direction}_blur_{blur_score:.2f}.jpg"
            filepath = os.path.join(top_dir, filename)
            cv2.imwrite(filepath, frame)
        
        # Save all frames
        for i, (frame, blur_score, direction) in enumerate(self.buffer.frames):
            filename = f"action_{i+1:03d}_{direction}_blur_{blur_score:.2f}.jpg"
            filepath = os.path.join(all_dir, filename)
            cv2.imwrite(filepath, frame)
        
        self.logger.info(f"Saved {len(top_frames)} top frames and {stats['count']} total frames")
        self.logger.info(f"Quality: avg={stats['avg_blur']:.1f}, range={stats['min_blur']:.1f}-{stats['max_blur']:.1f}")
    
    def show_top_frames_grid(self):
        """Display top 5 frames in a grid."""
        top_frames = self.buffer.get_top_frames(5)
        if not top_frames:
            self.logger.warning("No frames to display")
            return
        
        # Create grid layout
        grid_rows, grid_cols = 2, 3
        cell_width, cell_height = 640, 480
        grid = np.zeros((grid_rows * cell_height, grid_cols * cell_width, 3), dtype=np.uint8)
        
        for idx, (frame, blur_score, direction) in enumerate(top_frames):
            if idx >= 5:
                break
            
            row, col = idx // grid_cols, idx % grid_cols
            resized = cv2.resize(frame, (cell_width, cell_height))
            
            # Add ranking and score
            cv2.putText(resized, f"#{idx + 1}", (20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            cv2.putText(resized, f"Blur: {blur_score:.1f}", (20, 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # Place in grid
            y_start, x_start = row * cell_height, col * cell_width
            grid[y_start:y_start + cell_height, x_start:x_start + cell_width] = resized
        
        cv2.namedWindow("Top 5 Frames", cv2.WINDOW_NORMAL)
        cv2.imshow("Top 5 Frames", grid)
        
        # Wait for keypress
        while True:
            key = cv2.waitKey(1) & 0xFF
            if key in [ord('c'), ord('C'), ord('q')]:
                cv2.destroyWindow("Top 5 Frames")
                break
    
    def start(self):
        """Start the application main loop."""
        self.logger.info("=== Fridge Item Capture System ===")
        self.logger.info(f"Blur threshold: {self.config.capture.blur_threshold}")
        self.logger.info(f"Hand detection: {'ENABLED' if self.config.capture.enable_hand_detection else 'DISABLED'}")
        self.logger.info(f"Vision API: {'ENABLED' if self.vision_analyzer else 'DISABLED'}")
        
        if not self.camera.start():
            self.logger.error("Could not open camera")
            return
        
        self.camera.set_frame_callback(self.on_new_frame)
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.window_name, 1280, 720)
        
        # Main display loop
        while True:
            display_frame = self._get_display_frame()
            cv2.imshow(self.window_name, display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if not self._handle_keypress(key):
                break
        
        # Cleanup
        self._cleanup()
    
    def _get_display_frame(self) -> np.ndarray:
        """Get the appropriate frame to display based on current mode."""
        if self.browsing_frames and self.buffer.get_frame_count() > 0:
            frame, blur_score, direction = self.buffer.frames[self.current_browse_index]
            return self.add_text_to_frame(frame, blur_score, self.current_browse_index, direction)
        
        elif self.show_best_frame and self.best_frame_display is not None:
            best_frame, blur_score, direction = self.buffer.get_best_frame()
            return self.add_text_to_frame(self.best_frame_display, blur_score, None, direction)
        
        elif self.latest_annotated_frame is not None:
            return self.add_text_to_frame(self.latest_annotated_frame)
        
        else:
            # No frame yet
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Initializing camera...", (150, 240),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            return blank
    
    def _handle_keypress(self, key: int) -> bool:
        """
        Handle keyboard input.
        
        Args:
            key: Key code
            
        Returns:
            True to continue, False to quit
        """
        if key in [ord('q'), ord('Q')]:
            return False
        
        elif key in [ord('c'), ord('C')]:
            if not self.is_capturing and not self.show_best_frame and not self.browsing_frames:
                self.on_trigger()
            else:
                self.is_capturing = False
                self.show_best_frame = False
                self.browsing_frames = False
                self.best_frame_display = None
                self.logger.info("Returned to live view")
        
        elif key in [ord('s'), ord('S')]:
            if self.is_capturing:
                self.on_untrigger()
        
        elif key in [ord('t'), ord('T')]:
            if self.show_best_frame and self.buffer.get_frame_count() > 0:
                self.show_top_frames_grid()
        
        elif key in [ord('b'), ord('B')]:
            if self.show_best_frame and self.buffer.get_frame_count() > 0:
                self.browsing_frames = True
                self.show_best_frame = False
                self.current_browse_index = 0
                self.logger.info(f"Browsing {self.buffer.get_frame_count()} frames")
        
        elif key in [ord('v'), ord('V')]:
            if self.buffer.get_frame_count() > 0:
                self.save_captured_frames()
        
        elif key in [81, 2]:  # Left arrow
            if self.browsing_frames and self.buffer.get_frame_count() > 0:
                self.current_browse_index = (self.current_browse_index - 1) % self.buffer.get_frame_count()
        
        elif key in [83, 3]:  # Right arrow
            if self.browsing_frames and self.buffer.get_frame_count() > 0:
                self.current_browse_index = (self.current_browse_index + 1) % self.buffer.get_frame_count()
        
        return True
    
    def _cleanup(self):
        """Clean up resources."""
        self.camera.stop()
        if self.hand_detector:
            self.hand_detector.close()
        cv2.destroyAllWindows()
        self.logger.info("Application closed")


def main():
    """Main entry point."""
    # Setup logging
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f"fridge_tracker_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logger = setup_logger(
        name="FridgeTracker",
        level=logging.INFO,
        log_file=log_file,
        console_output=True
    )
    
    # Load configuration
    config_path = "config.json"
    if os.path.exists(config_path):
        config = AppConfig.load(config_path)
        logger.info(f"Loaded configuration from {config_path}")
    else:
        config = AppConfig.from_env()
        config.save(config_path)
        logger.info(f"Created default configuration at {config_path}")
        logger.warning("Please set your OPENAI_API_KEY in config.json to enable Vision API features")
    
    # Create and start controller
    try:
        controller = CaptureController(config)
        controller.start()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.exception(f"Fatal error: {e}")


if __name__ == "__main__":
    main()
