"""
Inference module for grocery classification (PyTorch)
"""
import json
import torch
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import torch.nn as nn


class GroceryPredictor:
    """Predictor for grocery item classification"""
    
    def __init__(self, model_path, class_labels_path):
        """Initialize predictor with model and class labels"""
        with open(class_labels_path, 'r') as f:
            self.class_info = json.load(f)
        
        num_classes = self.class_info['num_classes']
        
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
        self.model.load_state_dict(torch.load(model_path, map_location='cpu', weights_only=True))
        self.model.eval()
        
        # Use MPS if available
        self.device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
        self.model = self.model.to(self.device)
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
    def preprocess_image(self, image_input):
        """Preprocess image for prediction"""
        
        # Handle different input types
        if isinstance(image_input, str):
            img = Image.open(image_input)
        else:
            img = image_input
        
        # Convert to RGB
        img = img.convert('RGB')
        
        # Transform and add batch dimension
        img_tensor = self.transform(img).unsqueeze(0)
        
        return img_tensor
    
    def predict(self, image_input, top_k=5):
        """
        Predict class for an image
        
        Returns:
            List of (class_name, confidence) tuples
        """
        img_tensor = self.preprocess_image(image_input)
        img_tensor = img_tensor.to(self.device)
        
        with torch.no_grad():
            outputs = self.model(img_tensor)
            probabilities = F.softmax(outputs, dim=1)[0]
        
        # Get top-k predictions
        top_probs, top_indices = torch.topk(probabilities, top_k)
        
        results = []
        for prob, idx in zip(top_probs, top_indices):
            class_name = self.class_info['idx_to_class'][str(idx.item())]
            confidence = float(prob.item())
            results.append((class_name, confidence))
        
        return results

