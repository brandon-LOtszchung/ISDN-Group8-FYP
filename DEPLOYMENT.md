# Deploy to Laptop - Complete Guide

## ✅ Status: Code Committed to Git!

Your code is saved locally. To push to GitHub, see `GIT_PUSH_INSTRUCTIONS.md`

---

# Deploy to Laptop

## 📦 What You Need to Transfer

### **Must Transfer (for app to work):**
1. **All code** (already in git) ✅
2. **Trained model**: `models/grocery_model.pth` (81 MB) ⚠️ NOT in git

### **Don't Need:**
- ❌ `GroceryStoreDataset/` (129 MB) - only for training
- ❌ `venv/` (797 MB) - will recreate on laptop

---

## 🚀 Option 1: Git + Manual Model Transfer (Recommended)

### **On Your Laptop:**

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ISDN-Group8-FYP

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Transfer the trained model
# Copy grocery_model.pth from Mac mini to laptop
# Place it in: models/grocery_model.pth
```

### **Transfer Model File:**

**Method A: USB Drive**
```bash
# On Mac mini:
cp models/grocery_model.pth /Volumes/USB_DRIVE/

# On Laptop:
cp /Volumes/USB_DRIVE/grocery_model.pth models/
```

**Method B: AirDrop** (Mac to Mac)
- Right-click `models/grocery_model.pth`
- Select "Share" → "AirDrop"
- Send to your laptop

**Method C: Cloud (Google Drive, Dropbox)**
- Upload `grocery_model.pth` from Mac mini
- Download on laptop

**Method D: SCP (if on same network)**
```bash
# On laptop, from project directory:
scp brandonlotc@mac-mini-ip:/Users/brandonlotc/Desktop/ISDN-Group8-FYP/models/grocery_model.pth models/
```

### **5. Run the App**

```bash
# On laptop
cd ISDN-Group8-FYP
source venv/bin/activate
python app/app.py
```

Open: http://localhost:8080

---

## 🚀 Option 2: Full Project Transfer (Simpler but larger)

### **Zip and Transfer Entire Project:**

```bash
# On Mac mini:
cd /Users/brandonlotc/Desktop
zip -r ISDN-Group8-FYP.zip ISDN-Group8-FYP \
  -x "*/venv/*" \
  -x "*/GroceryStoreDataset/*" \
  -x "*/.git/*" \
  -x "*/__pycache__/*"

# This creates a ~100MB zip (includes model)
# Transfer via USB, AirDrop, or cloud
```

### **On Laptop:**

```bash
# Unzip
unzip ISDN-Group8-FYP.zip
cd ISDN-Group8-FYP

# Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run
python app/app.py
```

---

## 🔧 Troubleshooting on Laptop

### **"No module named 'torch'"**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### **"Model file not found"**
Make sure `models/grocery_model.pth` exists on laptop

### **"Port 8080 in use"**
Change port in `app/app.py` line 65 to another port (e.g., 8081)

### **Windows Laptop Notes**
- Use `venv\Scripts\activate` instead of `source venv/bin/activate`
- Use `python` instead of `python3`
- Everything else is the same!

---

## ✅ What Works on Laptop

Once deployed:
- ✅ Live camera feed
- ✅ Real-time predictions
- ✅ All 43 grocery categories
- ✅ Same 92.57% accuracy
- ✅ Green box targeting

**Just needs**: Python 3.8+, webcam, and the model file!

