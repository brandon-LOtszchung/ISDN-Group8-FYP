"""
Flask web application for live grocery item identification
Production-ready with logging, error handling, and health checks
"""
import os
import sys
import base64
import logging
from io import BytesIO
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from PIL import Image
import coloredlogs

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from src.predictor import GroceryPredictor
from src.config import (
    FLASK_HOST, FLASK_PORT, FLASK_DEBUG,
    MODEL_PATH, LABELS_PATH,
    TOP_K_PREDICTIONS, ENABLE_MODEL_COMPILE,
    WARMUP_ITERATIONS, DEVICE
)

# Configure logging
coloredlogs.install(
    level=logging.INFO,
    fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global predictor instance
predictor = None


def initialize_predictor():
    """Initialize the predictor with error handling"""
    global predictor
    try:
        logger.info("Initializing predictor...")
        logger.info(f"Model path: {MODEL_PATH}")
        logger.info(f"Labels path: {LABELS_PATH}")
        logger.info(f"Device: {DEVICE}")
        
        predictor = GroceryPredictor(
            model_path=MODEL_PATH,
            class_labels_path=LABELS_PATH,
            device=DEVICE,
            enable_compile=ENABLE_MODEL_COMPILE,
            warmup=True
        )
        
        logger.info("✅ Model loaded successfully")
        model_info = predictor.get_model_info()
        logger.info(f"Classes: {model_info['num_classes']}, Device: {model_info['device']}")
        
        return True
        
    except FileNotFoundError as e:
        logger.error(f"⚠️  Model files not found: {e}")
        logger.error("Please ensure model files exist in models/ directory")
        return False
    except Exception as e:
        logger.error(f"⚠️  Failed to load model: {e}", exc_info=True)
        return False


@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    if predictor is None:
        return jsonify({
            'status': 'unhealthy',
            'message': 'Model not loaded'
        }), 503
    
    try:
        model_info = predictor.get_model_info()
        return jsonify({
            'status': 'healthy',
            'model': {
                'num_classes': model_info['num_classes'],
                'device': model_info['device']
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'message': str(e)
        }), 503


@app.route('/model/info', methods=['GET'])
def model_info():
    """Get detailed model information"""
    if predictor is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        info = predictor.get_model_info()
        return jsonify({
            'success': True,
            'info': info
        }), 200
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict grocery item from image
    
    Expected JSON payload:
    {
        "image": "data:image/jpeg;base64,..."
    }
    """
    if predictor is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 503
    
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
        
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "image" field in request'
            }), 400
        
        # Decode base64 image
        try:
            image_data_str = data['image']
            if ',' in image_data_str:
                image_data = image_data_str.split(',')[1]
            else:
                image_data = image_data_str
                
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            return jsonify({
                'success': False,
                'error': 'Invalid image data'
            }), 400
        
        # Make prediction
        predictions = predictor.predict(image, top_k=TOP_K_PREDICTIONS)
        
        # Format results
        results = [
            {
                'class': name,
                'confidence': round(conf * 100, 1)
            }
            for name, conf in predictions
        ]
        
        return jsonify({
            'success': True,
            'predictions': results
        }), 200
    
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error during prediction'
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🛒 Grocery Item Identifier - Production Server")
    print("="*60)
    
    # Initialize predictor
    if initialize_predictor():
        print(f"✅ Server ready")
        print(f"🌐 URL: http://{FLASK_HOST}:{FLASK_PORT}")
        print(f"📊 Health check: http://{FLASK_HOST}:{FLASK_PORT}/health")
        print(f"🔧 Debug mode: {FLASK_DEBUG}")
        print("="*60 + "\n")
        
        app.run(debug=FLASK_DEBUG, host=FLASK_HOST, port=FLASK_PORT)
    else:
        print("❌ Failed to start server - model not loaded")
        print("="*60 + "\n")
        sys.exit(1)

