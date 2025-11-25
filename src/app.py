"""Simple camera client - record video and send to cloud."""
import cv2
import os
import logging
from datetime import datetime

from camera import Camera
from client import APIClient
from config import AppConfig
from utils.logger import setup_logger


class Controller:
    """Main controller for camera client."""
    
    def __init__(self, config: AppConfig, headless: bool = False):
        """Initialize controller.
        
        Args:
            config: Application configuration
            headless: Run without GUI (for servers/embedded systems)
        """
        self.config = config
        self.headless = headless
        self.logger = logging.getLogger("Controller")
        
        # Initialize camera
        self.camera = Camera(
            camera_index=config.camera.index,
            camera_url=config.camera.url if config.camera.url else None
        )
        
        # Initialize API client
        self.api_client = None
        if config.vision_api.api_key:
            self.api_client = APIClient(
                api_url=config.vision_api.api_key,  # Note: api_key field is actually the API URL
                timeout=120,
                retry_attempts=config.vision_api.retry_attempts
            )
            if self.api_client.health_check():
                self.logger.info("✓ Connected to cloud API")
            else:
                self.logger.warning("⚠ Cloud API unreachable")
        
        # State
        self.window_name = "Fridge Camera"
        self.inventory_cache = []
        
    def run(self):
        """Main application loop."""
        self.logger.info("=== Camera Client Started ===")
        
        if self.headless:
            self.logger.info("Running in headless mode (no GUI)")
        
        if not self.camera.start():
            self.logger.error("Failed to start camera")
            return
        
        # Only create window if not headless
        if not self.headless:
            cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
            cv2.resizeWindow(self.window_name, 1280, 720)
        
        # Sync inventory
        if self.api_client:
            try:
                result = self.api_client.session.get(
                    f"{self.api_client.api_url}/api/inventory",
                    timeout=5
                )
                if result.status_code == 200:
                    self.inventory_cache = result.json().get("inventory", [])
            except:
                pass
        
        if self.headless:
            self.logger.info("Commands: Press CTRL+C to record, wait 5s, CTRL+C again to stop and process")
            self._run_headless()
        else:
            self.logger.info("Press 'R' to start recording, 'S' to stop, 'Q' to quit")
            self._run_gui()
        
        # Cleanup
        self.camera.stop()
        if not self.headless:
            cv2.destroyAllWindows()
        self.logger.info("Application closed")
    
    def _run_headless(self):
        """Run in headless mode without GUI."""
        import time
        import signal
        
        self.logger.info("Headless mode: Recording will start automatically...")
        time.sleep(2)
        
        def signal_handler(sig, frame):
            """Handle interrupts."""
            if not self.camera.is_recording:
                self.logger.info("\nStarting recording...")
                self.camera.start_recording()
                self.logger.info("Recording... Press CTRL+C again after 5 seconds to stop")
            else:
                self.logger.info("\nStopping recording...")
                video_path = self.camera.stop_recording()
                if video_path:
                    self._process_video(video_path)
                self.logger.info("Done. Press CTRL+C to exit or wait to start new recording")
        
        signal.signal(signal.SIGINT, signal_handler)
        
        frame_count = 0
        try:
            while True:
                frame = self.camera.get_frame()
                
                if frame is None:
                    self.logger.error("Failed to get frame")
                    break
                
                # Record frame if recording
                if self.camera.is_recording:
                    self.camera.record_frame(frame)
                
                frame_count += 1
                if frame_count % 300 == 0:  # Every ~10 seconds at 30fps
                    if self.camera.is_recording:
                        self.logger.info("Still recording... (CTRL+C to stop)")
                    else:
                        self.logger.info("Ready (CTRL+C to start recording)")
                
                time.sleep(0.01)  # Small delay
        except KeyboardInterrupt:
            self.logger.info("Shutting down...")
    
    def _run_gui(self):
        """Run with GUI display."""
        while True:
            frame = self.camera.get_frame()
            
            if frame is None:
                self.logger.error("Failed to get frame")
                break
            
            # Record frame if recording
            if self.camera.is_recording:
                self.camera.record_frame(frame)
            
            # Add overlay
            display_frame = self._add_overlay(frame)
            cv2.imshow(self.window_name, display_frame)
            
            # Handle keys
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q') or key == ord('Q'):
                break
            
            elif key == ord('r') or key == ord('R'):
                if not self.camera.is_recording:
                    self.camera.start_recording()
            
            elif key == ord('s') or key == ord('S'):
                if self.camera.is_recording:
                    video_path = self.camera.stop_recording()
                    if video_path:
                        self._process_video(video_path)
    
    def _add_overlay(self, frame):
        """Add status overlay to frame."""
        display = frame.copy()
        height, width = display.shape[:2]
        
        # Semi-transparent overlay
        overlay = display.copy()
        cv2.rectangle(overlay, (10, 10), (600, 180), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.3, display, 0.7, 0, display)
        
        # Recording status
        if self.camera.is_recording:
            status_text = "⚫ RECORDING"
            status_color = (0, 0, 255)
            # Blinking red circle
            cv2.circle(display, (30, 30), 10, (0, 0, 255), -1)
        else:
            status_text = "⚪ READY"
            status_color = (255, 255, 255)
        
        cv2.putText(display, status_text, (50, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)
        
        # Cloud status
        if self.api_client:
            cloud_status = "Cloud: CONNECTED" if self.api_client.health_check() else "Cloud: OFFLINE"
            cloud_color = (0, 255, 0) if "CONNECTED" in cloud_status else (100, 100, 100)
        else:
            cloud_status = "Cloud: NOT CONFIGURED"
            cloud_color = (100, 100, 100)
        
        cv2.putText(display, cloud_status, (20, 80),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, cloud_color, 2)
        
        # Inventory
        if self.inventory_cache:
            inv_text = f"Inventory: {', '.join(self.inventory_cache[:3])}"
            if len(self.inventory_cache) > 3:
                inv_text += f" +{len(self.inventory_cache) - 3} more"
        else:
            inv_text = "Inventory: Empty"
        
        cv2.putText(display, inv_text, (20, 110),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # Instructions
        instructions = "R=Record | S=Stop | Q=Quit"
        cv2.putText(display, instructions, (20, height - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        
        return display
    
    def _process_video(self, video_path: str):
        """Upload video to cloud and process result."""
        if not self.api_client:
            self.logger.warning("No API client configured - video saved locally")
            return
        
        self.logger.info("Uploading video to cloud...")
        
        metadata = {
            "timestamp": datetime.now().isoformat(),
            "camera_id": str(self.config.camera.index)
        }
        
        result = self.api_client.upload_video(video_path, metadata)
        
        if result.get("success"):
            self.logger.info(f"✓ {result.get('description', 'Analysis complete')}")
            
            if result.get("items"):
                self.logger.info(f"  Items: {', '.join(result['items'])}")
            
            self.inventory_cache = result.get("inventory", [])
            if self.inventory_cache:
                self.logger.info(f"  Inventory: {', '.join(self.inventory_cache)}")
        else:
            self.logger.error(f"✗ {result.get('description', 'Unknown error')}")
        
        # Delete temp video file
        try:
            os.remove(video_path)
            self.logger.info(f"Cleaned up temp file: {video_path}")
        except Exception as e:
            self.logger.warning(f"Failed to delete temp file: {e}")


def main():
    """Entry point."""
    import sys
    
    # Check for headless mode
    headless = '--headless' in sys.argv or '-H' in sys.argv
    
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f"camera_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logger = setup_logger(
        name="Camera",
        level=logging.INFO,
        log_file=log_file,
        console_output=True
    )
    
    config_path = "config.json"
    if os.path.exists(config_path):
        config = AppConfig.load(config_path)
    else:
        config = AppConfig.from_env()
        config.save(config_path)
        logger.warning("Created default config - set cloud API URL in config.json")
    
    try:
        controller = Controller(config, headless=headless)
        controller.run()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.exception(f"Fatal error: {e}")


if __name__ == "__main__":
    main()

