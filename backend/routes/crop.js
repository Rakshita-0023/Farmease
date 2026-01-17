const express = require("express");
const axios = require("axios");

const router = express.Router();

// ML API URL - use environment variable or fallback to local
const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";

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
    
    const response = await axios.post(
      `${ML_API_URL}/predict-crop`,
      cropData,
      { 
        timeout: 30000, // 30 seconds for cold starts
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

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
    
    res.status(500).json({
      success: false,
      message: errorMessage,
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
      ml_service: response.data,
      ml_api_url: ML_API_URL
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "ML service unavailable",
      ml_api_url: ML_API_URL
    });
  }
});

module.exports = router;
