#!/bin/bash

echo "🚀 Starting FarmEase ML Service..."

# Download models if they don't exist
echo "📦 Checking for model files..."
python download_models.py

# Start the FastAPI server
echo "🌱 Starting FastAPI server..."
python app.py
