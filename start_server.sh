#!/bin/bash

# Start Smart Fridge Inventory API Server
cd /root/ISDN-Group8-FYP/src

echo "Starting API server on http://0.0.0.0:8000"
echo "API Documentation: http://159.223.45.101:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

