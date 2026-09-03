#!/bin/bash

echo "🚀 Starting FarmEase ML Service..."

# Model downloads are optional and must never prevent Uvicorn from binding.
echo "📦 Checking for model files..."
python download_models.py || echo "⚠️ Optional model download check failed; starting in degraded mode"

# Start the FastAPI server with uvicorn on Render's port
echo "🌱 Starting FastAPI server on port ${PORT:-10000}..."
uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}
