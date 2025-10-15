# Fridge Item Tracking System - Flow Documentation

## Technology Stack

### Core Technologies
- **Python 3.9** - Main programming language
- **OpenCV (cv2)** - Camera capture & image processing
- **MediaPipe** - Real-time hand detection & tracking
- **OpenAI GPT-4o Vision** - AI-powered item identification
- **NumPy** - Array operations

### System Components
```
src/
├── main.py                      # Main controller & workflow
├── inventory_manager.py         # Inventory tracking
├── capture/
│   ├── camera_manager.py        # Camera stream management
│   └── frame_buffer.py          # Frame storage & quality filtering
└── analysis/
    ├── hand_detector.py         # MediaPipe hand detection
    ├── blur_detector.py         # Laplacian blur detection
    └── vision_analyzer.py       # GPT-4o integration
```

---

## Complete Workflow

### 1. System Initialization
```
User starts application
    ↓
Camera initializes (1.5s warm-up)
    ↓
MediaPipe hand detector loads
    ↓
GPT-4o Vision API connects
    ↓
System ready - Shows live feed with IN/OUT zones
```

### 2. Action Capture Flow

#### **Phase 1: INITIAL_OUT (Before Fridge)**
```
User presses 'C' to start
    ↓
Hand appears in OUT zone (top half)
    ↓
Action #1 starts
    ↓
System buffers ALL frames:
  ├─ MediaPipe detects hand ✓
  ├─ Blur score calculated (Laplacian variance)
  ├─ If blur ≥ threshold → Add to initial_out_buffer[]
  └─ Logs: "[Buffering] Initial OUT frame: blur 52.3"
    ↓
Example buffer: 15 frames captured
```

#### **Phase 2: Transition to IN_ZONE**
```
Hand crosses line (Y > 0.5)
    ↓
Zone change detected: OUT → IN
    ↓
Select BEST frame from initial_out_buffer:
  ├─ Find highest blur score
  └─ Save as Image #1
    ↓
Phase changes to: IN_ZONE
    ↓
Logs: "✓ Selected best from 15 frames → Image #1: blur 54.2"
```

#### **Phase 3: IN_ZONE (Inside Fridge)**
```
Hand in fridge (placing/grabbing item)
    ↓
No capturing - just zone tracking
    ↓
Waiting for exit...
```

#### **Phase 4: EXIT_OUT (After Fridge)**
```
Hand crosses back (Y < 0.5)
    ↓
Zone change detected: IN → OUT
    ↓
Phase changes to: EXIT_OUT
    ↓
System buffers ALL exit frames:
  ├─ Blur score calculated
  ├─ If blur ≥ threshold → Add to exit_out_buffer[]
  └─ Logs: "[Buffering] Exit OUT frame: blur 48.9"
    ↓
Example buffer: 12 frames captured
```

#### **Phase 5: Action Completion**
```
Hand disappears for 0.5 seconds (15 frames)
    ↓
Action completion triggered
    ↓
Select BEST frame from exit_out_buffer:
  ├─ Find highest blur score
  └─ Save as Image #2
    ↓
Logs: "✓ Selected best from 12 frames → Image #2: blur 49.5"
```

### 3. AI Analysis (GPT-4o Vision)

#### **Image Analysis**
```
Send Image #1 to GPT-4o Vision API
    ↓
Prompt includes:
  ├─ "What is the hand holding?"
  ├─ Current inventory list (for consistency)
  └─ Request JSON format
    ↓
GPT Response: {"empty": false, "items": ["white mug"], 
               "quantity": 1, "description": "One white mug"}
    ↓
Logs: "Before: One white mug"

    ↓

Send Image #2 to GPT-4o Vision API
    ↓
Same prompt with updated inventory
    ↓
GPT Response: {"empty": true, "items": [], 
               "quantity": 0, "description": "Empty hand"}
    ↓
Logs: "After: Empty hand"
```

#### **Action Determination**
```
Compare Before vs After:
    ↓
Logic:
  ├─ "white mug" + "empty" → PLACED
  ├─ "empty" + "white mug" → REMOVED
  └─ "item A" + "item B" → SWAPPED
    ↓
Result: "PLACED one white mug"
    ↓
Update Inventory:
  └─ Add "white mug" to inventory
    ↓
Logs: "✓ DETECTED: Placed One white mug"
Logs: "→ Inventory updated: ['1x white mug']"
```

### 4. Multiple Actions

```
Action #1: Place white mug
  Before: white mug (1) | After: empty
  → Inventory: ['1x white mug']

Action #2: Place tomato
  Before: tomato (1) | After: empty
  → Inventory: ['1x white mug', '1x tomato']

Action #3: Remove white mug
  Before: empty | After: white mug (1)
  GPT sees inventory: ['1x white mug', '1x tomato']
  → Uses EXACT name "white mug" (not "white cup")
  → Inventory: ['1x tomato']
```

### 5. Review & Export

#### **Browse Mode (Press 'B')**
```
Shows each action's 2 images:
  ├─ Action 1 - Image 1/2 | PLACED
  ├─ Action 1 - Image 2/2 | PLACED
  ├─ Action 2 - Image 1/2 | PLACED
  └─ Arrow keys to navigate
```

#### **Save to Disk (Press 'V')**
```
Saves to: captured_frames/session_TIMESTAMP/
├── top_5/
│   ├── TOP1_PLACED_blur_54.2.jpg
│   └── TOP2_REMOVED_blur_49.5.jpg
└── all_frames/
    ├── action_001_PLACED_blur_54.2.jpg (mug in hand)
    ├── action_002_PLACED_blur_49.5.jpg (empty hand)
    ├── action_003_PLACED_blur_58.1.jpg (tomato in hand)
    └── action_004_PLACED_blur_51.7.jpg (empty hand)
```

---

## Key Features

### Quality Assurance
- **Blur Detection**: Laplacian variance (only sharp images kept)
- **Hand Detection**: MediaPipe 21-point tracking
- **Zone Detection**: Automatic IN/OUT boundary detection
- **Best Frame Selection**: From ALL frames in each OUT window

### Smart Inventory
- **Consistent Naming**: GPT uses inventory list for name matching
- **Real-time Updates**: Inventory updates after each action
- **Prevents Confusion**: "white mug" stays "white mug" (not "cup")

### Action Detection
- **2 Images Per Action**: Before & after fridge interaction
- **Automatic Direction**: PLACED vs REMOVED vs SWAPPED
- **Quantity Detection**: Counts multiple items (3 eggs, 2 apples)

---

## Timing Breakdown

| Event | Time | Duration |
|-------|------|----------|
| Hand appears in OUT | 0s | - |
| Initial OUT buffering | 0-3s | 3s |
| Cross to IN zone | 3s | - |
| Inside fridge | 3-5s | 2s |
| Cross back to OUT | 5s | - |
| Exit OUT buffering | 5-8s | 3s |
| Hand disappears | 8s | - |
| GPT-4o Analysis | 8-12s | 4s |
| **Results displayed** | **12s** | - |

**Total per action: ~12 seconds** (including 4s AI analysis)

---

## Configuration Parameters

```python
CAPTURE_INTERVAL = 1           # Check every frame
BLUR_THRESHOLD = 35.0          # Minimum sharpness (lower = more lenient)
HAND_ABSENCE_THRESHOLD = 15    # 0.5s to complete action
OPENAI_API_KEY = "your-key"    # GPT-4o Vision access
```

---

## User Controls

| Key | Function |
|-----|----------|
| C | Start/Stop capturing |
| S | Stop and review results |
| B | Browse all actions (2 images each) |
| T | Top 5 sharpest frames grid |
| V | Save to disk |
| Q | Quit |

---

## Output Example

### Console Output
```
>>> Action #1 started - Phase: INITIAL_OUT
    [Buffering] Initial OUT frame: blur 52.3 (15 frames)
    ✓ Selected best from 15 frames → Image #1: blur 54.2
    Phase: IN_ZONE
    Phase: EXIT_OUT
    [Buffering] Exit OUT frame: blur 48.9 (12 frames)
    ✓ Selected best from 12 exit frames → Image #2: blur 49.5

    Analyzing with GPT-4o Vision...
      Before: One white mug
      After: Empty hand
    
    ✓ DETECTED: Placed One white mug
    → Inventory updated: ['1x white mug']

    Action #1 COMPLETED: PLACED (2 images)
```

### Saved Files
```
captured_frames/session_20251015_120300/
├── top_5/
│   ├── TOP1_PLACED_blur_54.20.jpg
│   └── TOP2_PLACED_blur_49.50.jpg
└── all_frames/
    ├── action_001_PLACED_blur_54.20.jpg
    └── action_002_PLACED_blur_49.50.jpg
```

