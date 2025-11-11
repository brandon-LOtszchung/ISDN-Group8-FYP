let video, canvas, ctx;
let stream = null;
let isRunning = false;
let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);
    
    // Check server health on load
    checkServerHealth();
});

async function checkServerHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            updateStatus('Ready', 'success');
            console.log('Server is healthy:', data);
        } else {
            updateStatus('Server unhealthy', 'error');
            console.error('Server unhealthy:', data);
        }
    } catch (error) {
        updateStatus('Cannot connect to server', 'error');
        console.error('Health check failed:', error);
    }
}

function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = `Status: ${message}`;
    
    // Update status color based on type
    if (type === 'success') {
        statusEl.style.color = '#4ade80';
    } else if (type === 'error') {
        statusEl.style.color = '#ef4444';
    } else if (type === 'warning') {
        statusEl.style.color = '#fbbf24';
    } else {
        statusEl.style.color = '#888';
    }
}

async function startCamera() {
    try {
        updateStatus('Starting camera...', 'info');
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        isRunning = true;
        consecutiveErrors = 0;
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
        updateStatus('Running', 'success');
        
        // Wait for video to be ready
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            predictLoop();
        };
        
    } catch (error) {
        updateStatus('Camera error', 'error');
        
        let errorMessage = 'Failed to access camera.';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application.';
        }
        
        alert(errorMessage);
        console.error('Camera error:', error);
    }
}

function stopCamera() {
    isRunning = false;
    consecutiveErrors = 0;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    updateStatus('Stopped', 'info');
    
    clearResults();
}

async function predictLoop() {
    if (!isRunning) return;
    
    // Capture full frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Crop center area (green box region - 300x300px)
    const boxSize = 300;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const cropX = centerX - boxSize / 2;
    const cropY = centerY - boxSize / 2;
    
    // Create temporary canvas for cropped region
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = boxSize;
    cropCanvas.height = boxSize;
    const cropCtx = cropCanvas.getContext('2d');
    
    // Draw cropped region (only the green box area)
    cropCtx.drawImage(
        canvas,
        cropX, cropY, boxSize, boxSize,  // Source crop area
        0, 0, boxSize, boxSize            // Destination
    );
    
    const imageData = cropCanvas.toDataURL('image/jpeg', 0.8);
    
    // Send for prediction
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.predictions);
            updateFPS();
            consecutiveErrors = 0; // Reset error counter on success
            
            if (consecutiveErrors > 0) {
                updateStatus('Running', 'success');
            }
        } else {
            throw new Error(data.error || 'Prediction failed');
        }
        
    } catch (error) {
        consecutiveErrors++;
        
        if (error.name === 'AbortError') {
            console.error('Prediction timeout');
            updateStatus('Prediction timeout', 'warning');
        } else {
            console.error('Prediction error:', error);
            updateStatus('Connection error', 'warning');
        }
        
        // Stop if too many consecutive errors
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            updateStatus('Too many errors - stopped', 'error');
            stopCamera();
            alert('Too many consecutive errors. Please check your connection and try again.');
            return;
        }
    }
    
    // Continue loop (adjust delay for performance)
    setTimeout(() => predictLoop(), 500); // Predict every 500ms
}

function displayResults(predictions) {
    predictions.forEach((pred, index) => {
        const resultEl = document.getElementById(`result${index + 1}`);
        if (resultEl) {
            resultEl.querySelector('.name').textContent = pred.class;
            resultEl.querySelector('.confidence').textContent = pred.confidence + '%';
        }
    });
}

function clearResults() {
    for (let i = 1; i <= 3; i++) {
        const resultEl = document.getElementById(`result${i}`);
        if (resultEl) {
            resultEl.querySelector('.name').textContent = '-';
            resultEl.querySelector('.confidence').textContent = '-';
        }
    }
    document.getElementById('fps').textContent = 'FPS: -';
}

function updateFPS() {
    frameCount++;
    const now = Date.now();
    const elapsed = (now - lastFrameTime) / 1000;
    
    if (elapsed >= 1.0) {
        fps = (frameCount / elapsed).toFixed(1);
        document.getElementById('fps').textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastFrameTime = now;
    }
}

