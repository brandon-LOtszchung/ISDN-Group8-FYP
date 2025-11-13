"""Configuration management for Fridge Item Tracking System."""
import os
import json
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict


@dataclass
class CameraConfig:
    """Camera-related configuration."""
    index: int = 0
    url: str = ""  # Network camera URL (rtsp://ip:port/stream or http://ip/video)
    warm_up_time: float = 1.5
    

@dataclass
class CaptureConfig:
    """Frame capture configuration."""
    capture_interval: int = 1
    blur_threshold: float = 35.0
    hand_absence_threshold: int = 15
    enable_hand_detection: bool = True


@dataclass
class HandDetectionConfig:
    """Hand detection configuration."""
    min_detection_confidence: float = 0.7
    min_tracking_confidence: float = 0.5
    max_num_hands: int = 2


@dataclass
class VisionAPIConfig:
    """Vision API configuration."""
    api_key: str = ""
    model: str = "gpt-4o"
    max_tokens: int = 300
    temperature: float = 0
    retry_attempts: int = 3
    retry_delay: float = 1.0


@dataclass
class StorageConfig:
    """Storage and output configuration."""
    output_dir: str = "captured_frames"
    inventory_file: str = "inventory.json"
    enable_auto_save: bool = True
    

@dataclass
class AppConfig:
    """Main application configuration."""
    camera: CameraConfig
    capture: CaptureConfig
    hand_detection: HandDetectionConfig
    vision_api: VisionAPIConfig
    storage: StorageConfig
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'AppConfig':
        """Create AppConfig from dictionary."""
        return cls(
            camera=CameraConfig(**config_dict.get('camera', {})),
            capture=CaptureConfig(**config_dict.get('capture', {})),
            hand_detection=HandDetectionConfig(**config_dict.get('hand_detection', {})),
            vision_api=VisionAPIConfig(**config_dict.get('vision_api', {})),
            storage=StorageConfig(**config_dict.get('storage', {}))
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert AppConfig to dictionary."""
        return {
            'camera': asdict(self.camera),
            'capture': asdict(self.capture),
            'hand_detection': asdict(self.hand_detection),
            'vision_api': asdict(self.vision_api),
            'storage': asdict(self.storage)
        }
    
    @classmethod
    def load(cls, config_path: str) -> 'AppConfig':
        """Load configuration from JSON file."""
        if not os.path.exists(config_path):
            print(f"Config file not found at {config_path}, using defaults")
            return cls.default()
        
        try:
            with open(config_path, 'r') as f:
                config_dict = json.load(f)
            return cls.from_dict(config_dict)
        except Exception as e:
            print(f"Error loading config: {e}, using defaults")
            return cls.default()
    
    def save(self, config_path: str):
        """Save configuration to JSON file."""
        try:
            os.makedirs(os.path.dirname(config_path) or '.', exist_ok=True)
            with open(config_path, 'w') as f:
                json.dump(self.to_dict(), f, indent=2)
            print(f"Configuration saved to {config_path}")
        except Exception as e:
            print(f"Error saving config: {e}")
    
    @classmethod
    def default(cls) -> 'AppConfig':
        """Create default configuration."""
        return cls(
            camera=CameraConfig(),
            capture=CaptureConfig(),
            hand_detection=HandDetectionConfig(),
            vision_api=VisionAPIConfig(),
            storage=StorageConfig()
        )
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """Create configuration from environment variables."""
        config = cls.default()
        
        # Override with environment variables if they exist
        if 'OPENAI_API_KEY' in os.environ:
            config.vision_api.api_key = os.environ['OPENAI_API_KEY']
        
        if 'CAMERA_INDEX' in os.environ:
            config.camera.index = int(os.environ['CAMERA_INDEX'])
        
        if 'BLUR_THRESHOLD' in os.environ:
            config.capture.blur_threshold = float(os.environ['BLUR_THRESHOLD'])
        
        return config

