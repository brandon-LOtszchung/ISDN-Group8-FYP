#!/bin/bash
# Download trained model from GitHub Release

echo "📦 Downloading trained model..."

# GitHub Release URL (you'll update this after creating the release)
RELEASE_URL="https://github.com/brandon-LOtszchung/ISDN-Group8-FYP/releases/download/v1.0/grocery_model.pth"

# Download to models folder
mkdir -p models
curl -L -o models/grocery_model.pth "$RELEASE_URL"

if [ -f models/grocery_model.pth ]; then
    echo "✅ Model downloaded successfully!"
    ls -lh models/grocery_model.pth
else
    echo "❌ Download failed. Please download manually from:"
    echo "   https://github.com/brandon-LOtszchung/ISDN-Group8-FYP/releases"
fi

