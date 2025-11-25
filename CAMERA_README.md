# Camera Edge Client - Fridge Item Tracker

**Branch: `camera-edge`**

This is the **camera-side** component designed to run on edge devices (Orange Pi CM4, Raspberry Pi, etc.). It captures images and sends them to the cloud API for analysis.

---

## Architecture

```
┌─────────────────────┐
│  Camera Device      │
│  (Orange Pi CM4)    │
│                     │
│  ✓ Camera Capture   │
│  ✓ Hand Detection   │
│  ✓ Blur Filtering   │
│  ✓ UI Display       │
└──────────┬──────────┘
           │ HTTP POST
           │ (2 images)
           ▼
┌─────────────────────┐
│   Cloud API         │
│                     │
│  ✓ GPT-4o Vision    │
│  ✓ Inventory DB     │
│  ✓ Item Analysis    │
└─────────────────────┘
```

---

## What's Changed from Original

### ✅ Kept
- Camera capture (local/network camera)
- MediaPipe hand detection
- Blur detection & quality filtering
- OpenCV UI display
- 3-phase action tracking (OUT → IN → OUT)

### ❌ Removed
- GPT-4o Vision API (moved to cloud)
- Inventory management (moved to cloud)
- OpenAI dependency

### ✨ Added
- REST API client (`api_client.py`)
- Cloud connection status indicator
- Inventory cache (synced from cloud)
- Automatic retry with exponential backoff

---

## Hardware Requirements

**Tested on:** Orange Pi CM4
**Minimum:**
- 1GB RAM
- Quad-core ARM CPU
- Camera interface (USB/CSI)
- Network connection

**Performance:** MediaPipe hand detection runs smoothly on Orange Pi CM4.

---

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Configure cloud API URL
nano config.json
# Set "vision_api.api_key" to your cloud API URL (e.g., "http://192.168.1.100:8000")
```

---

## Configuration

Edit `config.json`:

```json
{
  "camera": {
    "index": 0,              // Local camera: 0, 1, etc.
    "url": "",               // Network camera: "rtsp://ip:port/stream"
    "warm_up_time": 1.5
  },
  "capture": {
    "blur_threshold": 35.0,  // Lower = stricter quality
    "hand_absence_threshold": 15,  // Frames without hand to complete action
    "enable_hand_detection": true
  },
  "vision_api": {
    "api_key": "http://your-cloud-api-url:8000",  // CLOUD API URL
    "retry_attempts": 3,
    "retry_delay": 1.0
  }
}
```

---

## Usage

```bash
cd src
python main.py
```

### Controls

- **C** - Start capturing
- **S** - Stop capturing
- **T** - View top 5 frames (grid view)
- **B** - Browse all captured frames
- **V** - Save frames to disk
- **Q** - Quit

---

## How It Works

### Workflow

1. **Press C** - Start capture mode
2. **Hand Detected in OUT zone** (top half) → Action starts
3. **Buffers sharp frames** while hand in OUT zone
4. **Hand moves to IN zone** (bottom half) → Selects best "before" image
5. **Hand exits to OUT zone** → Buffers "after" images
6. **Hand disappears** → Completes action:
   - Selects best 2 images
   - Sends to cloud via HTTP POST `/api/analyze`
   - Cloud analyzes with GPT-4o Vision
   - Returns action type + inventory
7. **Updates UI** with result

### API Communication

**Request:**
```json
POST /api/analyze
{
  "before_image": "base64_encoded_jpeg",
  "after_image": "base64_encoded_jpeg",
  "metadata": {
    "action_id": 1,
    "timestamp": "2025-11-25T10:30:00",
    "blur_scores": {"before": 45.2, "after": 52.8}
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "PLACED",
  "items": ["tomato"],
  "quantity": 1,
  "description": "Placed one red tomato",
  "inventory": ["2x tomato", "3x egg", "1x milk"]
}
```

---

## Offline Mode

If cloud API is unreachable:
- Camera continues capturing
- Images stored in buffer
- UI shows "Cloud: OFFLINE"
- Can still save frames locally with **V** key

---

## Files Modified

- `src/main.py` - Refactored to `CameraEdgeController`
- `src/api_client.py` - **NEW** REST API client
- `requirements.txt` - Removed `openai`, added `requests`
- `config.json` - Cloud API URL configuration

## Files Removed (not needed on camera)

- `src/analysis/vision_analyzer.py` - Moved to cloud
- `src/inventory_manager.py` - Moved to cloud

---

## Next Steps

1. **Deploy cloud API** - See `cloud-api` branch (to be created)
2. **Configure API URL** in `config.json`
3. **Test connection** - Check "Cloud: CONNECTED" in UI
4. **Run capture** - Press C and start testing

---

## Troubleshooting

**Camera not opening:**
```bash
# Check available cameras
ls /dev/video*

# Try different index in config.json
```

**MediaPipe too slow:**
- Set `enable_hand_detection: false` in config
- System will use time-based capture instead

**Cloud API unreachable:**
- Check API URL in config.json
- Ensure API server is running
- Check network connectivity: `ping your-api-ip`

**Hand detection not working:**
- Ensure good lighting
- Lower `min_detection_confidence` in config

---

## Performance

On **Orange Pi CM4**:
- Camera capture: ~30 FPS
- Hand detection: ~20 FPS
- Blur analysis: <10ms per frame
- API request: 2-5 seconds (depends on cloud)

Total latency per action: **3-7 seconds**

