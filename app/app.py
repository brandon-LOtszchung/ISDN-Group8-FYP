"""
Flask web application for live grocery item identification
"""
import os
import sys
import base64
from io import BytesIO
from flask import Flask, render_template, request, jsonify
from PIL import Image

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from src.predictor import GroceryPredictor

app = Flask(__name__)

# Initialize predictor
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'grocery_model.pth')
LABELS_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'class_labels.json')

try:
    predictor = GroceryPredictor(MODEL_PATH, LABELS_PATH)
    print("✅ Model loaded")
except Exception as e:
    print(f"⚠️  Model not loaded: {e}")
    print("Train model first and place in models/grocery_model.pth")
    predictor = None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    if predictor is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        predictions = predictor.predict(image, top_k=3)
        
        results = [
            {'class': name, 'confidence': round(conf * 100, 1)}
            for name, conf in predictions
        ]
        
        return jsonify({'success': True, 'predictions': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*50)
    print("🛒 Grocery Item Identifier - Live Feed")
    print("="*50)
    print("Server: http://localhost:8080")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=8080)

