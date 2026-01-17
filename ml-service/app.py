"""
FarmEase ML API - Crop Recommendation Service
Uses Random Forest model trained on agricultural data
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pickle
import numpy as np
from pathlib import Path

# Initialize FastAPI app
app = FastAPI(
    title="FarmEase ML API",
    description="Crop recommendation based on soil and climate data",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input data model
class CropInput(BaseModel):
    N: float = Field(..., ge=0, le=150, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=0, le=150, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=0, le=210, description="Potassium content (kg/ha)")
    temperature: float = Field(..., ge=0, le=50, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, le=400, description="Rainfall (mm)")

    class Config:
        schema_extra = {
            "example": {
                "N": 90,
                "P": 42,
                "K": 43,
                "temperature": 20.87,
                "humidity": 82.00,
                "ph": 6.50,
                "rainfall": 202.93
            }
        }

# Load model (will be created if doesn't exist)
MODEL_PATH = Path(__file__).parent / "crop_model.pkl"

def load_or_create_model():
    """Load existing model or create a simple rule-based fallback"""
    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"⚠️ Could not load model: {e}")
    
    print("ℹ️ Using rule-based crop recommendation (no ML model found)")
    return None

model = load_or_create_model()

# Crop mapping (for model output)
CROP_LABELS = [
    'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas',
    'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate',
    'banana', 'mango', 'grapes', 'watermelon', 'muskmelon',
    'apple', 'orange', 'papaya', 'coconut', 'cotton',
    'jute', 'coffee'
]

def rule_based_recommendation(data: CropInput) -> str:
    """
    Simple rule-based crop recommendation when ML model is not available
    Based on agricultural best practices
    """
    N, P, K = data.N, data.P, data.K
    temp = data.temperature
    humidity = data.humidity
    ph = data.ph
    rainfall = data.rainfall
    
    # Rice: High N, high rainfall, high humidity
    if rainfall > 200 and humidity > 80 and N > 80:
        return "rice"
    
    # Wheat: Moderate N, cool temperature, low rainfall
    if temp < 25 and rainfall < 100 and N > 50:
        return "wheat"
    
    # Cotton: High K, warm temperature, moderate rainfall
    if K > 40 and temp > 25 and 50 < rainfall < 150:
        return "cotton"
    
    # Maize: Balanced NPK, moderate conditions
    if 20 < temp < 30 and 50 < rainfall < 150:
        return "maize"
    
    # Sugarcane: High N, high rainfall, warm
    if N > 100 and rainfall > 150 and temp > 25:
        return "sugarcane"
    
    # Coffee: Acidic soil, high rainfall, moderate temp
    if ph < 6.5 and rainfall > 150 and 15 < temp < 28:
        return "coffee"
    
    # Banana: High K, high humidity, warm
    if K > 50 and humidity > 70 and temp > 20:
        return "banana"
    
    # Chickpea: Low rainfall, cool season
    if rainfall < 100 and temp < 25:
        return "chickpea"
    
    # Grapes: Moderate rainfall, warm, slightly acidic
    if 50 < rainfall < 150 and temp > 20 and 6 < ph < 7:
        return "grapes"
    
    # Default fallback
    return "maize"

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "FarmEase ML API",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.post("/predict-crop")
def predict_crop(data: CropInput):
    """
    Predict the best crop based on soil and climate parameters
    
    Returns:
        recommended_crop: Name of the recommended crop
        confidence: Prediction confidence (if ML model is used)
    """
    try:
        # Prepare input features
        features = np.array([[
            data.N,
            data.P,
            data.K,
            data.temperature,
            data.humidity,
            data.ph,
            data.rainfall
        ]])
        
        # Use ML model if available, otherwise use rule-based
        if model is not None:
            try:
                prediction = model.predict(features)[0]
                
                # Get confidence if model supports it
                confidence = None
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba(features)[0]
                    confidence = float(max(probabilities))
                
                # Map prediction to crop name
                if isinstance(prediction, (int, np.integer)):
                    crop = CROP_LABELS[prediction] if prediction < len(CROP_LABELS) else "maize"
                else:
                    crop = str(prediction).lower()
                
                return {
                    "recommended_crop": crop,
                    "confidence": confidence,
                    "method": "ml_model",
                    "input_data": data.dict()
                }
            except Exception as e:
                print(f"⚠️ ML prediction failed: {e}, falling back to rules")
        
        # Fallback to rule-based recommendation
        crop = rule_based_recommendation(data)
        
        return {
            "recommended_crop": crop,
            "confidence": None,
            "method": "rule_based",
            "input_data": data.dict()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/crops")
def get_supported_crops():
    """Get list of all supported crops"""
    return {
        "crops": CROP_LABELS,
        "total": len(CROP_LABELS)
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model else "rule_based",
        "supported_crops": len(CROP_LABELS)
    }

if __name__ == "__main__":
    import uvicorn
    print("🌱 Starting FarmEase ML API...")
    print(f"📊 Model loaded: {model is not None}")
    print(f"🌾 Supported crops: {len(CROP_LABELS)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
