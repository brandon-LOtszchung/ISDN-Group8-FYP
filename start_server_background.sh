#!/bin/bash

# Start API server in background with logging
cd /root/ISDN-Group8-FYP/src

LOG_FILE="/root/ISDN-Group8-FYP/server.log"

echo "Starting API server in background..."
echo "Logs will be written to: $LOG_FILE"
echo ""

nohup python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_FILE" 2>&1 &

SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
echo ""
echo "View logs with:"
echo "  tail -f $LOG_FILE"
echo ""
echo "Stop server with:"
echo "  kill $SERVER_PID"
echo ""
echo "Or use: pkill -f uvicorn"

