const express = require("express");
const axios = require("axios");

const router = express.Router();

// ML API URL - use environment variable or fallback to local
const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const recommendCropFallback = (input) => {
  const N = toNumber(input.N);
  const P = toNumber(input.P);
  const K = toNumber(input.K);
  const temperature = toNumber(input.temperature);
  const humidity = toNumber(input.humidity);
  const ph = toNumber(input.ph);
  const rainfall = toNumber(input.rainfall);

  if ([N, P, K, temperature, humidity, ph, rainfall].some(Number.isNaN)) {
    return "maize";
  }

  if (rainfall > 200 && humidity > 80 && N > 80) return "rice";
  if (temperature < 25 && rainfall < 100 && N > 50) return "wheat";
  if (K > 40 && temperature > 25 && rainfall > 50 && rainfall < 150) return "cotton";
  if (temperature > 20 && temperature < 30 && rainfall > 50 && rainfall < 150) return "maize";
  if (N > 100 && rainfall > 150 && temperature > 25) return "sugarcane";
  if (ph < 6.5 && rainfall > 150 && temperature > 15 && temperature < 28) return "coffee";
  if (K > 50 && humidity > 70 && temperature > 20) return "banana";
  if (rainfall < 100 && temperature < 25) return "chickpea";
  if (rainfall > 50 && rainfall < 150 && temperature > 20 && ph > 6 && ph < 7) return "grapes";

  return "maize";
};

const isMlUnavailableError = (error) => {
  return (
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ECONNABORTED" ||
    (error.response && error.response.status >= 500)
  );
};

// POST: Crop recommendation
router.post("/crop-recommendation", async (req, res) => {
  try {
    console.log("🌱 Crop recommendation request received");
    console.log("📊 Input data:", req.body);
    
    // 1. Validate input data
    const cropData = req.body;
    const requiredFields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
    const missingFields = requiredFields.filter(field => cropData[field] === undefined);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // 2. Call ML API with timeout for cold starts
    console.log(`🔗 Calling ML API: ${ML_API_URL}/predict-crop`);
    
    let response;
    try {
      response = await axios.post(
        `${ML_API_URL}/predict-crop`,
        cropData,
        {
          timeout: 30000, // 30 seconds for cold starts
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (mlError) {
      if (!isMlUnavailableError(mlError)) {
        throw mlError;
      }

      const fallbackCrop = recommendCropFallback(cropData);
      console.warn("⚠️ ML API unavailable. Returning backend fallback recommendation:", fallbackCrop);

      return res.json({
        success: true,
        recommendation: fallbackCrop,
        confidence: null,
        method: "rule_based_fallback_server",
        warning: "ML service unavailable. Used fallback recommendation."
      });
    }

    console.log("✅ ML API response:", response.data);

    // 3. Send ML response back to frontend
    res.json({
      success: true,
      recommendation: response.data.recommended_crop,
      confidence: response.data.confidence,
      method: response.data.method
    });

  } catch (error) {
    console.error("❌ Crop recommendation error:", error.message);
    
    // Provide helpful error messages
    let errorMessage = "ML service error";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "ML service is not running. Please start the ML API.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "ML service timeout. The service may be starting up (cold start).";
    } else if (error.response) {
      errorMessage = error.response.data?.detail || error.response.statusText;
    }
    
    const fallbackCrop = recommendCropFallback(req.body || {});

    res.status(500).json({
      success: false,
      message: errorMessage,
      fallback_recommendation: fallbackCrop,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Health check for ML service
router.get("/crop-recommendation/health", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      available: true,
      ml_service: response.data,
      ml_api_url: ML_API_URL
    });
  } catch (error) {
    res.json({
      success: true,
      available: false,
      degraded: true,
      message: "ML service unavailable - fallback recommendations remain active",
      ml_api_url: ML_API_URL,
      fallback: "rule_based_fallback_server"
    });
  }
});

module.exports = router;
