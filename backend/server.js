// ==================== IMPORTS ====================
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("./db");
require("dotenv").config();

// Routes
const createAuthRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const createUserRoutes = require("./routes/userRoutes");
const createWeatherRoutes = require("./routes/weatherRoutes");
const cropRoutes = require("./routes/crop"); // ✅ ML ROUTE
const plantDiseaseRoutes = require("./routes/plantDiseaseRoutes"); // ✅ PLANT DOCTOR ML ROUTE

// Market services
const IntegratedMarketService = require("./services/marketRegistry/integratedMarketService");
const { getProvider } = require("./services/marketProviders/index");

// ==================== APP INIT ====================
const app = express();
const PORT = process.env.PORT || 5001;

// ==================== CORS ====================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://farmeaseai.vercel.app",
  "https://farmeaseai-kappa.vercel.app",
  "https://farmease-zeta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true
}));

app.options(/.*/, cors());

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: "10mb" }));

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    status: "Backend is running",
    service: "Farmease API",
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTH HELPERS ====================
const storageState = { useLocalStorage: false };
const localData = { users: [], farms: [] };

const findUser = async (email) => {
  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return users[0];
};

const createUser = async (name, email, passwordHash) => {
  const [result] = await db.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash]
  );
  return result;
};

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ==================== ROUTES ====================
const authRoutes = createAuthRoutes(findUser, createUser);

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/user", createUserRoutes(db, storageState, localData, authenticateToken));
app.use("/api/weather", createWeatherRoutes(authenticateToken));

// ✅ ML CROP RECOMMENDATION ROUTE
app.use("/api", cropRoutes);

// ✅ ML PLANT DISEASE DETECTION ROUTE
app.use("/api", plantDiseaseRoutes);

// ==================== SIMPLE TEST ====================
app.get("/api/simple-test", (req, res) => {
  res.json({ message: "Simple test works" });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Farmease backend running on port ${PORT}`);
});

module.exports = app;
