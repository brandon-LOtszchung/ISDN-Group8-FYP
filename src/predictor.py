"""
Inference module for grocery classification (PyTorch)
"""
import json
import logging
from pathlib import Path
import torch
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import torch.nn as nn

logger = logging.getLogger(__name__)


class GroceryPredictor:
    """Predictor for grocery item classification with production-level optimizations"""
    
    def __init__(self, model_path, class_labels_path, device='auto', enable_compile=False, warmup=True):
        """
        Initialize predictor with model and class labels
        
        Args:
            model_path: Path to the trained model weights
            class_labels_path: Path to class labels JSON
            device: Device to use ('auto', 'cuda', 'mps', 'cpu')
            enable_compile: Enable torch.compile for faster inference (requires PyTorch 2.0+)
            warmup: Run warmup iterations for optimal performance
        """
        # Validate paths
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not Path(class_labels_path).exists():
            raise FileNotFoundError(f"Class labels file not found: {class_labels_path}")
        
        # Load class labels
        try:
            with open(class_labels_path, 'r') as f:
                self.class_info = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in class labels file: {e}")
        
        num_classes = self.class_info['num_classes']
        logger.info(f"Loaded {num_classes} classes from {class_labels_path}")
        
        # Build model architecture
        self.model = models.efficientnet_v2_s()
        num_features = self.model.classifier[1].in_features
        self.model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
        
        # Load weights
        logger.info(f"Loading model weights from {model_path}")
        try:
            self.model.load_state_dict(torch.load(model_path, map_location='cpu', weights_only=True))
        except Exception as e:
            raise RuntimeError(f"Failed to load model weights: {e}")
        
        self.model.eval()
        
        # Auto-detect best device
        self.device = self._get_device(device)
        logger.info(f"Using device: {self.device}")
        
        self.model = self.model.to(self.device)
        
        # Optional: Compile model for faster inference (PyTorch 2.0+)
        if enable_compile and hasattr(torch, 'compile'):
            try:
                logger.info("Compiling model with torch.compile...")
                self.model = torch.compile(self.model)
            except Exception as e:
                logger.warning(f"Failed to compile model: {e}")
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Warmup model for optimal performance
        if warmup:
            self._warmup()
    
    def _get_device(self, device_preference='auto'):
        """
        Auto-detect or set the best available device
        
        Args:
            device_preference: 'auto', 'cuda', 'mps', or 'cpu'
        
        Returns:
            torch.device object
        """
        if device_preference == 'auto':
            if torch.cuda.is_available():
                return torch.device('cuda')
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return torch.device('mps')
            else:
                return torch.device('cpu')
        else:
            return torch.device(device_preference)
    
    def _warmup(self, iterations=3):
        """
        Warmup the model with dummy inputs for optimal performance
        
        Args:
            iterations: Number of warmup iterations
        """
        logger.info(f"Warming up model with {iterations} iterations...")
        dummy_input = torch.randn(1, 3, 224, 224).to(self.device)
        
        with torch.no_grad():
            for _ in range(iterations):
                _ = self.model(dummy_input)
        
        logger.info("Warmup complete")
        
    def preprocess_image(self, image_input):
        """
        Preprocess image for prediction
        
        Args:
            image_input: PIL Image, file path, or numpy array
            
        Returns:
            Preprocessed tensor ready for model inference
        """
        try:
            # Handle different input types
            if isinstance(image_input, str):
                img = Image.open(image_input)
            elif isinstance(image_input, Image.Image):
                img = image_input
            else:
                raise ValueError(f"Unsupported image input type: {type(image_input)}")
            
            # Validate image
            if img.size[0] == 0 or img.size[1] == 0:
                raise ValueError("Image has zero width or height")
            
            # Convert to RGB
            img = img.convert('RGB')
            
            # Transform and add batch dimension
            img_tensor = self.transform(img).unsqueeze(0)
            
            return img_tensor
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    def predict(self, image_input, top_k=5):
        """
        Predict class for an image
        
        Args:
            image_input: PIL Image, file path, or numpy array
            top_k: Number of top predictions to return
            
        Returns:
            List of (class_name, confidence) tuples
        """
        try:
            # Validate top_k
            top_k = min(top_k, self.class_info['num_classes'])
            
            # Preprocess image
            img_tensor = self.preprocess_image(image_input)
            img_tensor = img_tensor.to(self.device)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(img_tensor)
                probabilities = F.softmax(outputs, dim=1)[0]
            
            # Get top-k predictions
            top_probs, top_indices = torch.topk(probabilities, top_k)
            
            # Format results
            results = []
            for prob, idx in zip(top_probs, top_indices):
                class_name = self.class_info['idx_to_class'][str(idx.item())]
                confidence = float(prob.item())
                results.append((class_name, confidence))
            
            return results
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise
    
    def get_model_info(self):
        """Get model metadata"""
        return {
            'num_classes': self.class_info['num_classes'],
            'device': str(self.device),
            'class_names': self.class_info['class_names']
        }

