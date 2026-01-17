# FarmEase ML API

AI-powered crop recommendation service for FarmEase.

## Features

- **Crop Recommendation**: Predicts the best crop based on soil nutrients (N, P, K), climate (temperature, humidity, rainfall), and soil pH
- **22 Supported Crops**: Rice, Maize, Wheat, Cotton, Sugarcane, Coffee, and more
- **Dual Mode**: Uses ML model if available, falls back to rule-based recommendations
- **Fast API**: RESTful API with automatic documentation

## Quick Start

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Start the Server

```bash
uvicorn app:app --reload
```

The API will be available at: `http://localhost:8000`

### 3. Test the API

Open your browser: `http://localhost:8000/docs`

Or test with curl:

```bash
curl -X POST "http://localhost:8000/predict-crop" \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.00,
    "ph": 6.50,
    "rainfall": 202.93
  }'
```

## API Endpoints

### POST /predict-crop
Predict the best crop for given conditions.

**Request Body:**
```json
{
  "N": 90,           // Nitrogen (kg/ha)
  "P": 42,           // Phosphorus (kg/ha)
  "K": 43,           // Potassium (kg/ha)
  "temperature": 20.87,  // Temperature (°C)
  "humidity": 82.00,     // Humidity (%)
  "ph": 6.50,           // Soil pH
  "rainfall": 202.93    // Rainfall (mm)
}
```

**Response:**
```json
{
  "recommended_crop": "rice",
  "confidence": 0.95,
  "method": "rule_based",
  "input_data": {...}
}
```

### GET /crops
Get list of all supported crops.

### GET /health
Health check endpoint.

## Supported Crops

Rice, Maize, Chickpea, Kidney Beans, Pigeon Peas, Moth Beans, Mung Bean, Black Gram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee

## Rule-Based Logic

When ML model is not available, the system uses agricultural best practices:

- **Rice**: High nitrogen, high rainfall, high humidity
- **Wheat**: Moderate nitrogen, cool temperature, low rainfall
- **Cotton**: High potassium, warm temperature, moderate rainfall
- **Maize**: Balanced NPK, moderate conditions
- **Coffee**: Acidic soil, high rainfall, moderate temperature
- And more...

## Adding ML Model

To use a trained ML model instead of rules:

1. Train your model (Random Forest, XGBoost, etc.)
2. Save it as `crop_model.pkl` in the `ml-service` folder
3. Restart the server

The API will automatically detect and use the ML model.

## Production Deployment

For production, use:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

Or deploy to:
- **Render**: Add as a web service
- **Railway**: Connect GitHub repo
- **AWS Lambda**: Use Mangum adapter
- **Docker**: Build and deploy container

## Integration with FarmEase

The backend (`backend/routes/crop.js`) connects to this ML API:

```javascript
const response = await axios.post(
  "http://127.0.0.1:8000/predict-crop",
  cropData
);
```

In production, update the URL to your deployed ML service.
