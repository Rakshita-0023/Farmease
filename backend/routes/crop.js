const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST: Crop recommendation
router.post("/crop-recommendation", async (req, res) => {
  try {
    // 1. Get data from frontend
    const cropData = req.body;

    // 2. Call ML API
    const response = await axios.post(
      "http://127.0.0.1:8000/predict-crop",
      cropData
    );

    // 3. Send ML response back to frontend
    res.json({
      success: true,
      recommendation: response.data.recommended_crop
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "ML service error"
    });
  }
});

module.exports = router;
