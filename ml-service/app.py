"""
FarmEase ML API - Crop Recommendation & Plant Disease Detection Service
- Crop Recommendation: Random Forest model trained on agricultural data
- Disease Detection: CNN model trained on PlantVillage dataset
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import pickle
import numpy as np
from pathlib import Path
from PIL import Image
import io
import os

# Initialize FastAPI app
MODEL_VERSION = os.getenv("FARMEASE_MODEL_VERSION", "unknown")
SKIP_MODEL_LOADING = os.getenv("FARMEASE_SKIP_MODEL_LOADING", "false").lower() == "true"
CORS_ORIGINS = [origin.strip() for origin in os.getenv(
    "FARMEASE_CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
).split(",") if origin.strip()]

app = FastAPI(
    title="FarmEase ML API",
    description="Crop recommendation and plant disease detection",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 20.87,
            "humidity": 82.00,
            "ph": 6.50,
            "rainfall": 202.93
        }
    })

# Load model (will be created if doesn't exist)
MODEL_PATH = Path(__file__).parent / "crop_model.pkl"
DISEASE_MODEL_PATH = Path(__file__).parent / "disease_model.h5"
DISEASE_CLASSES_PATH = Path(__file__).parent / "disease_classes.txt"
MAX_IMAGE_BYTES = 10 * 1024 * 1024

def load_or_create_model():
    """Load existing model or create a simple rule-based fallback"""
    if SKIP_MODEL_LOADING:
        print("ℹ️ Model loading skipped by FARMEASE_SKIP_MODEL_LOADING")
        return None
    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"⚠️ Could not load model: {e}")
    
    print("ℹ️ Using rule-based crop recommendation (no ML model found)")
    return None

def load_disease_model():
    """Load TensorFlow disease detection model"""
    if SKIP_MODEL_LOADING:
        return None
    if DISEASE_MODEL_PATH.exists():
        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(str(DISEASE_MODEL_PATH))
            print("✅ Disease detection model loaded successfully")
            return model
        except Exception as e:
            print(f"⚠️ Could not load disease model: {e}")
            return None
    print("ℹ️ Disease detection model not found")
    return None

def load_disease_classes():
    """Load disease class names"""
    if SKIP_MODEL_LOADING:
        return []
    if DISEASE_CLASSES_PATH.exists():
        try:
            with open(DISEASE_CLASSES_PATH, 'r') as f:
                classes = [line.strip() for line in f.readlines()]
            print(f"✅ Loaded {len(classes)} disease classes")
            return classes
        except Exception as e:
            print(f"⚠️ Could not load disease classes: {e}")
            return []
    print("ℹ️ Disease classes file not found")
    return []

model = load_or_create_model()
disease_model = load_disease_model()
disease_classes = load_disease_classes()

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
        "version": "2.0.0",
        "model_version": MODEL_VERSION
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
                    "fallback_used": False,
                    "model": {"identifier": "crop-recommendation", "version": MODEL_VERSION},
                    "input_data": data.model_dump()
                }
            except Exception as e:
                print(f"⚠️ ML prediction failed: {e}, falling back to rules")
        
        # Fallback to rule-based recommendation
        crop = rule_based_recommendation(data)
        
        return {
            "recommended_crop": crop,
            "confidence": None,
            "method": "rule_based",
            "fallback_used": True,
            "model": {"identifier": "crop-recommendation-rules", "version": "builtin"},
            "input_data": data.model_dump()
        }
        
    except HTTPException:
        raise
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
        "crop_model_loaded": model is not None,
        "crop_model_type": type(model).__name__ if model else "rule_based",
        "disease_model_loaded": disease_model is not None,
        "disease_classes_count": len(disease_classes),
        "supported_crops": len(CROP_LABELS),
        "model_version": MODEL_VERSION,
        "cors_origins_configured": len(CORS_ORIGINS)
    }

@app.post("/predict-disease")
async def predict_disease(file: UploadFile = File(...)):
    """
    Predict plant disease from uploaded image
    
    Returns:
        disease: Name of the detected disease
        confidence: Prediction confidence percentage
    """
    try:
        if disease_model is None:
            raise HTTPException(
                status_code=503,
                detail="Disease detection model not loaded"
            )
        
        if not disease_classes:
            raise HTTPException(
                status_code=503,
                detail="Disease classes not loaded"
            )

        if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are supported")
        
        # Read and preprocess image
        image_bytes = await file.read()
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit")
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Uploaded file is not a readable image") from exc
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        predictions = disease_model.predict(image_array, verbose=0)
        class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][class_index])
        
        disease_name = disease_classes[class_index] if class_index < len(disease_classes) else "Unknown"
        
        return {
            "status": "success",
            "disease": disease_name,
            "confidence": round(confidence * 100, 2),
            "model": {"identifier": "plant-disease-classifier", "version": MODEL_VERSION},
            "fallback_used": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Disease prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    print("🌱 Starting FarmEase ML API...")
    print(f"📊 Crop model loaded: {model is not None}")
    print(f"🌾 Supported crops: {len(CROP_LABELS)}")
    print(f"🍃 Disease model loaded: {disease_model is not None}")
    print(f"🦠 Disease classes: {len(disease_classes)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
