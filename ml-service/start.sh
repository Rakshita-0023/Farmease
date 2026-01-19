#!/bin/bash

echo "🚀 Starting FarmEase ML Service..."

# Download models if they don't exist
echo "📦 Checking for model files..."
python download_models.py

# Start the FastAPI server with uvicorn on Render's port
echo "🌱 Starting FastAPI server on port ${PORT:-10000}..."
uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}
