let video, canvas, ctx;
let stream = null;
let isRunning = false;
let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);
});

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        isRunning = true;
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
        document.getElementById('status').textContent = 'Status: Running';
        
        // Wait for video to be ready
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            predictLoop();
        };
        
    } catch (error) {
        alert('Camera error: ' + error.message);
        console.error(error);
    }
}

function stopCamera() {
    isRunning = false;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('status').textContent = 'Status: Stopped';
    
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
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.predictions);
            updateFPS();
        }
        
    } catch (error) {
        console.error('Prediction error:', error);
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

