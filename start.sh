#!/bin/bash
set -e

echo "=== Starting PromptBench Services ==="

# 1. Start Python LLM Service in background on port 8001
echo "Starting Python LLM Service on port 8001..."
cd /app/code/llm_service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 &
PYTHON_PID=$!

# Wait for Python service to be ready
echo "Waiting for Python LLM Service to initialize..."
for i in {1..30}; do
  if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "Python LLM Service is healthy!"
    break
  fi
  sleep 1
done

# 2. Start Node.js Express server on port 7860
echo "Starting Node.js Backend Server on port 7860..."
cd /app/code/server
node dist/index.js &
NODE_PID=$!

# Trap signals for graceful shutdown
trap "kill -TERM $PYTHON_PID $NODE_PID" SIGINT SIGTERM EXIT

wait -n $PYTHON_PID $NODE_PID
