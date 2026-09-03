const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

// Plant Doctor ML API URL
const PLANT_DOCTOR_API_URL = process.env.PLANT_DOCTOR_API_URL || 'https://farmease-plant-doctor.onrender.com';
const PLANT_DOCTOR_LOCAL_API_URL = process.env.PLANT_DOCTOR_LOCAL_API_URL || 'http://127.0.0.1:8000';

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/plant-disease
 * Detect plant disease from uploaded image
 */
router.post('/plant-disease', upload.single('file'), async (req, res) => {
  try {
    console.log('🌿 Plant disease detection request received');
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please upload a plant leaf image.'
      });
    }

    console.log(`📸 Image received: ${req.file.originalname} (${req.file.size} bytes)`);
    const candidateApis = [PLANT_DOCTOR_API_URL, PLANT_DOCTOR_LOCAL_API_URL].filter(Boolean);
    console.log(`🔗 Forwarding to ML API candidates: ${candidateApis.join(', ')}`);

    // Create form data to forward to ML API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Forward image to ML API with timeout for cold starts
    let response = null;
    let lastError = null;
    for (const apiBase of candidateApis) {
      try {
        response = await axios.post(
          `${apiBase}/predict-disease`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            },
            timeout: 30000, // 30 seconds for cold starts
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        console.log(`✅ Plant disease response from: ${apiBase}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Plant disease API failed: ${apiBase} -> ${error.message}`);
      }
    }

    if (!response) {
      return res.status(503).json({
        success: false,
        code: 'INTELLIGENCE_SERVICE_UNAVAILABLE',
        message: 'Plant Doctor ML service is unavailable. Please retry when the service is online.',
        details: process.env.NODE_ENV === 'development' ? lastError?.message : undefined
      });
    }

    console.log('✅ ML API response:', response.data);

    // Clean up disease name (remove underscores, format nicely)
    const diseaseName = response.data.disease || 'Unknown';
    const formattedDisease = diseaseName
      .replace(/___/g, ' - ')
      .replace(/_/g, ' ')
      .trim();

    // Return clean response to frontend
    res.json({
      success: true,
      disease: formattedDisease,
      rawDisease: diseaseName,
      confidence: response.data.confidence || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Plant disease detection error:', error.message);

    // Provide helpful error messages
    let errorMessage = 'Failed to detect plant disease';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Plant Doctor ML service is not running';
      statusCode = 503;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Plant Doctor ML service timeout. The service may be starting up (cold start). Please try again.';
      statusCode = 504;
    } else if (error.response) {
      errorMessage = error.response.data?.detail || error.response.data?.message || error.response.statusText;
      statusCode = error.response.status;
    } else if (error.message.includes('Only image files')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/plant-disease/health
 * Check if Plant Doctor ML service is available
 */
router.get('/plant-disease/health', async (req, res) => {
  try {
    let response;
    try {
      response = await axios.get(`${PLANT_DOCTOR_API_URL}/health`, { timeout: 5000 });
    } catch {
      response = await axios.get(`${PLANT_DOCTOR_LOCAL_API_URL}/health`, { timeout: 5000 });
    }
    res.json({
      success: true,
      available: true,
      ml_service: response.data,
      ml_api_url: response.config?.url || PLANT_DOCTOR_API_URL
    });
  } catch (error) {
    res.json({
      success: true,
      available: false,
      degraded: true,
      message: 'Plant Doctor ML service unavailable',
      ml_api_url: PLANT_DOCTOR_API_URL
    });
  }
});

module.exports = router;
