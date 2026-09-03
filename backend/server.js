const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
require('dotenv').config() // ✅ Load env vars FIRST before any other imports

const db = require('./db')
// Import auth routes factory
const createAuthRoutes = require('./routes/authRoutes')
const locationRoutes = require('./routes/locationRoutes')
const createUserRoutes = require('./routes/userRoutes')
const createWeatherRoutes = require('./routes/weatherRoutes')
const cropRoutes = require('./routes/crop') // ✅ ML CROP RECOMMENDATION
const plantDiseaseRoutes = require('./routes/plantDiseaseRoutes') // ✅ PLANT DISEASE DETECTION
const { createV1Router } = require('./routes/v1')

// INTEGRATED MARKET SERVICE WITH REGISTRY
const IntegratedMarketService = require('./services/marketRegistry/integratedMarketService')
const integratedMarketService = new IntegratedMarketService()

// Legacy provider for fallback
const { getProvider } = require('./services/marketProviders/index');

const app = express()
const PORT = Number(process.env.PORT) || 5001

// Process health must not depend on a provider or database being available.
// Database readiness is reported separately and is updated by initDB below.
const databaseState = {
  status: 'initializing',
  type: require('./db').dbType,
  error: null,
  checkedAt: null
}

// ============================================
// CORS MUST BE FIRST - BEFORE ANY ROUTES
// ============================================
const staticAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://farmease-one.vercel.app',
  'https://farmease-ftr3nnj2s-rakshita-s-projects.vercel.app',
  'https://farmease-dlysywo9g-rakshita-s-projects.vercel.app',
  'https://farmeaseai-kappa.vercel.app',
  'https://farmeaseai.vercel.app',
  'https://farmease-zeta.vercel.app'
];

// Optional override via env, comma-separated (useful for new preview domains).
const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...staticAllowedOrigins, ...envAllowedOrigins]);
const vercelPreviewPattern = /^https:\/\/farmease-[a-z0-9-]+-rakshita-s-projects\.vercel\.app$/;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.has(origin) || vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }
    
    console.log('⚠️ CORS blocked origin:', origin);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Language', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id']
};
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes (Express 5 compatible)
app.options(/.*/, cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    status: "Backend is running",
    service: "Farmease API",
    timestamp: new Date().toISOString()
  });
});

// Local storage fallback (For Users/Farms ONLY - Market data is always dynamic)
const storageState = {
  useLocalStorage: false
}
const localData = {
  users: [],
  farms: [],
  activities: [],
  diagnoses: [],
  posts: []
  // marketPrices removed - strictly dynamic now
}

// Initialize database connection
async function initDB() {
  try {
    // Production: Use DATABASE_URL (PostgreSQL or MySQL)
    if (process.env.DATABASE_URL) {
      const dbType = require('./db').dbType
      console.log(`📊 Production mode: Using ${dbType.toUpperCase()} Database`)
      console.log('🔍 Testing database connection...')
      await db.query('SELECT 1')
      console.log(`✅ ${dbType.toUpperCase()} database connected successfully`)
      
      // Create tables based on database type
      if (dbType === 'postgres') {
        await createTablesPostgres()
      } else if (dbType === 'mysql') {
        await createTablesMySQL()
      }
      storageState.useLocalStorage = false
    } else {
      // Development only: SQLite
      console.log('📊 Development mode: Using SQLite Database')
      await db.query('SELECT 1')
      console.log('✅ SQLite database connected successfully')
      await createTablesSQLite()
      storageState.useLocalStorage = false
    }
    databaseState.status = 'ready'
    databaseState.error = null
    databaseState.checkedAt = new Date().toISOString()
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    databaseState.status = 'unavailable'
    databaseState.error = err.message
    databaseState.checkedAt = new Date().toISOString()
    
    // In production, do NOT fall back to in-memory - fail loudly
    if (process.env.DATABASE_URL) {
      console.error('🚨 CRITICAL: Database connection failed in production!')
      console.error('🚨 Check DATABASE_URL and database server status')
      // Still allow server to start but log the error
    }
    
    if (process.env.DATABASE_URL) {
      // Never silently downgrade a production deployment to ephemeral memory.
      storageState.useLocalStorage = false
      console.error('🚨 Production database is unavailable; database-backed requests will return errors')
    } else {
      console.warn('⚠️ Using in-memory storage (development only; data will not persist)')
      storageState.useLocalStorage = true
    }
  }

  // Startup check for Google Config
  const googleId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (googleId) {
    console.log('✅ Google Auth: Client ID loaded (Starts with ' + googleId.substring(0, 10) + '...)');
  } else {
    console.log('ℹ️ Google Auth: Client ID not configured');
  }
}

// MySQL tables (for Railway/Production)
async function createTablesMySQL() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255) DEFAULT 'India',
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS farms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      crop VARCHAR(255) NOT NULL,
      area DECIMAL(10, 2) NOT NULL,
      soil_type VARCHAR(100),
      planting_date DATE,
      health_score INT DEFAULT 100,
      days_to_harvest INT,
      progress INT DEFAULT 0,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farm_id INT NOT NULL,
      type VARCHAR(100) NOT NULL,
      description TEXT,
      date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS diagnoses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      crop VARCHAR(255),
      disease VARCHAR(255),
      confidence DECIMAL(5, 2),
      recommendations TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  ]

  for (const sql of tables) {
    try {
      await db.query(sql)
    } catch (err) {
      console.log('Table may already exist:', err.message)
    }
  }
  console.log('✅ MySQL tables ready')
}

// PostgreSQL tables (for Render/Supabase/Neon/Production)
async function createTablesPostgres() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255) DEFAULT 'India',
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS farms (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      crop VARCHAR(255) NOT NULL,
      area DECIMAL(10, 2) NOT NULL,
      soil_type VARCHAR(100),
      planting_date DATE,
      health_score INTEGER DEFAULT 100,
      days_to_harvest INTEGER,
      progress INTEGER DEFAULT 0,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      farm_id INTEGER REFERENCES farms(id),
      type VARCHAR(100) NOT NULL,
      details TEXT,
      quantity TEXT,
      date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS plant_diagnoses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      disease VARCHAR(255),
      confidence DECIMAL(5, 2),
      symptoms TEXT,
      remedy TEXT,
      type VARCHAR(100),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS forum_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      tags TEXT,
      likes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES forum_posts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS market_prices (
      id SERIAL PRIMARY KEY,
      commodity TEXT NOT NULL,
      variety TEXT,
      market TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      min_price DECIMAL(10, 2) NOT NULL,
      max_price DECIMAL(10, 2) NOT NULL,
      modal_price DECIMAL(10, 2) NOT NULL,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      trend VARCHAR(50) DEFAULT 'stable',
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  for (const sql of tables) {
    try {
      await db.query(sql)
    } catch (err) {
      console.log('Table creation note:', err.message)
    }
  }
  console.log('✅ PostgreSQL tables ready')
}

// SQLite tables (for local development)
async function createTablesSQLite() {

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      crop TEXT NOT NULL,
      area REAL NOT NULL,
      soil_type TEXT,
      planting_date DATE,
      health_score INTEGER DEFAULT 100,
      days_to_harvest INTEGER,
      progress INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      farm_id INTEGER,
      type TEXT NOT NULL,
      details TEXT,
      quantity TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (farm_id) REFERENCES farms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS plant_diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      disease TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      symptoms TEXT,
      remedy TEXT,
      type TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      likes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commodity TEXT NOT NULL,
      variety TEXT,
      market TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      modal_price REAL NOT NULL,
      latitude REAL,
      longitude REAL,
      trend TEXT DEFAULT 'stable',
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  for (const table of tables) {
    await db.execute(table)
  }

  console.log('✅ SQLite tables created successfully')
}

// Seed market data with Dec 2025 prices (only if table is empty)

// ==================== LOCATION API ====================
// ==================== LOCATION API ====================
// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' })
  }
})

const findUser = async (email) => {
  console.log(`🔍 Finding user: ${email} (Mode: ${storageState.useLocalStorage ? 'Local' : 'DB'})`)
  if (storageState.useLocalStorage) {
    const user = localData.users.find(u => u.email === email)
    console.log(`🔍 Local find result: ${user ? 'Found' : 'Not Found'}`)
    return user
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email])
    console.log(`🔍 DB find result: ${users.length > 0 ? 'Found' : 'Not Found'}`)
    if (users.length > 0) {
      console.log(`🔍 User data:`, JSON.stringify(users[0], null, 2))
    }
    return users[0]
  } catch (error) {
    console.error('❌ DB findUser error:', error.message)
    throw error
  }
}

const createUser = async (name, email, passwordHash) => {
  console.log(`📝 Creating user: ${email} (Mode: ${storageState.useLocalStorage ? 'Local' : 'DB'})`)
  if (storageState.useLocalStorage) {
    const newUser = {
      id: localData.users.length + 1,
      name,
      email,
      password_hash: passwordHash,
      city: null,
      state: null,
      country: 'India',
      latitude: null,
      longitude: null,
      created_at: new Date()
    }
    localData.users.push(newUser)
    console.log(`📝 Local user created with ID: ${newUser.id}`)
    return { insertId: newUser.id }
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    )
    console.log(`📝 DB user created with ID: ${result.insertId}`)
    return result
  } catch (error) {
    console.error('❌ DB createUser error:', error.message)
    throw error
  }
}

// Inject helper functions into auth routes
const authRoutes = createAuthRoutes(findUser, createUser)

// Mount auth routes
app.use('/api/auth', authRoutes)

const getUserFarms = async (userId) => {
  if (storageState.useLocalStorage) {
    return localData.farms.filter(f => f.user_id === userId)
  }
  const [farms] = await db.query(
    'SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  )
  return farms
}

const createFarm = async (userId, farmData) => {
  console.log('📝 createFarm called with userId:', userId, 'farmData:', farmData)
  
  const { name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location } = farmData
  const lat = location ? location.lat : null
  const lng = location ? location.lng : null

  if (storageState.useLocalStorage) {
    console.log('📝 Using local storage for farm creation')
    const newFarm = {
      id: localData.farms.length + 1,
      user_id: userId,
      name, crop, area, soil_type: soilType, planting_date: plantingDate,
      health_score: healthScore, days_to_harvest: daysToHarvest, progress,
      latitude: lat, longitude: lng,
      created_at: new Date()
    }
    localData.farms.push(newFarm)
    console.log('✅ Farm created in local storage with ID:', newFarm.id)
    return { insertId: newFarm.id }
  }

  console.log('📝 Using database for farm creation')
  const [result] = await db.execute(
    'INSERT INTO farms (user_id, name, crop, area, soil_type, planting_date, health_score, days_to_harvest, progress, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, lat, lng]
  )
  console.log('✅ Farm created in database:', result)
  return result
}

// Rate limiting middleware
const rateLimit = {}
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip
  const now = Date.now()

  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 1, resetTime: now + 60000 }
  } else if (now > rateLimit[ip].resetTime) {
    rateLimit[ip] = { count: 1, resetTime: now + 60000 }
  } else {
    rateLimit[ip].count++
  }

  if (rateLimit[ip].count > 100) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  next()
}

app.use(rateLimitMiddleware)

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    
    // CRITICAL: Check if userId is valid
    if (!user || !user.userId) {
      return res.status(401).json({ error: 'Invalid token - please log in again' })
    }
    
    req.user = user
    next()
  })
}

// Input validation middleware
const validateInput = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }
  next()
}

// Authentication routes are now handled by /routes/authRoutes.js
// Mounted at /api/auth

// Mount routers
app.use('/api/locations', locationRoutes)
app.use('/api/user', createUserRoutes(db, storageState, localData, authenticateToken))
app.use('/api/weather', createWeatherRoutes(authenticateToken))
// Versioned public FarmEase Core surface. Legacy `/api/*` routes remain supported
// for the reference farmer application.
app.use('/api/v1', createV1Router({ readiness: () => ({ ...databaseState, error: databaseState.error ? 'database connection unavailable' : null }) }))

// ✅ ML ROUTES
app.use('/api', cropRoutes)
app.use('/api', plantDiseaseRoutes)

// ✅ KISAN CHARCHA ROUTES
const charchaRoutes = require('./routes/charchaRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/charchas', authenticateToken, charchaRoutes);
app.use('/api/charchas', authenticateToken, membershipRoutes);
app.use('/api/charchas', authenticateToken, messageRoutes);
app.use('/api/join-requests', authenticateToken, membershipRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Protected routes
app.get('/api/farms', authenticateToken, async (req, res) => {
  try {
    const farms = await getUserFarms(req.user.userId)
    res.json(farms)
  } catch (error) {
    console.error('Fetch farms error:', error)
    res.status(500).json({ error: 'Failed to fetch farms' })
  }
})

app.get('/api/dashboard/overview', authenticateToken, async (req, res) => {
  try {
    const lang = String(req.query.lang || req.headers['x-language'] || 'en').toLowerCase();
    const copy = getDashboardCopy(lang);

    const [users] = await db.query(
      'SELECT name, city, state, country, latitude, longitude FROM users WHERE id = ?',
      [req.user.userId]
    );
    const profile = users?.[0] || {};

    const lat = Number(req.query.lat || profile.latitude || 0);
    const lng = Number(req.query.lng || profile.longitude || 0);

    const farms = await getUserFarms(req.user.userId);
    const farmMetrics = {
      totalFarms: farms.length,
      activeCrops: farms.filter(f => (f.progress || 0) < 100).length,
      harvestReady: farms.filter(f => (f.progress || 0) >= 90).length,
      healthScore: farms.length > 0
        ? Math.round(farms.reduce((sum, farm) => sum + (farm.health_score || 0), 0) / farms.length)
        : 0
    };

    const weather = lat && lng ? await fetchCurrentWeather(lat, lng) : null;

    let nearbyMarkets = [];
    if (lat && lng) {
      const marketResult = await integratedMarketService.getVerifiedMarketsWithPrices(lat, lng, 50);
      nearbyMarkets = Array.isArray(marketResult?.markets) ? marketResult.markets : [];
    }
    const trendingCrops = nearbyMarkets
      .flatMap(m => m.commodities || [])
      .filter(c => Number(c.modal_price || 0) > 0)
      .slice(0, 4);

    let cropAdvice = copy.cropCold;
    if (weather?.temperature > 28) cropAdvice = copy.cropHeat;

    let irrigationAdvice = copy.irrigationModerate;
    if (weather?.humidity > 75) irrigationAdvice = copy.irrigationHumidity;
    if (weather?.temperature > 32 && weather?.humidity < 40) irrigationAdvice = copy.irrigationDryHeat;

    let weatherStatus = copy.favorable;
    let weatherStatusType = 'favorable';
    if (weather?.temperature > 38) {
      weatherStatus = copy.extremeHeat;
      weatherStatusType = 'danger';
    } else if ((weather?.rainProb || 0) > 70) {
      weatherStatus = copy.heavyRain;
      weatherStatusType = 'warning';
    } else if ((weather?.windSpeed || 0) > 25) {
      weatherStatus = copy.highWinds;
      weatherStatusType = 'warning';
    }

    const setupDone = [
      farmMetrics.totalFarms > 0,
      Boolean(profile.city),
      Boolean(weather),
      trendingCrops.length > 0
    ].filter(Boolean).length;

    const statsCards = farmMetrics.totalFarms > 0
      ? [
          { value: farmMetrics.totalFarms, label: copy.totalFarms },
          { value: farmMetrics.activeCrops, label: copy.activeCrops },
          { value: farmMetrics.harvestReady, label: copy.harvestReady },
          { value: `${farmMetrics.healthScore}%`, label: copy.healthScore }
        ]
      : [
          { value: `${setupDone}/4`, label: copy.setupComplete },
          { value: copy.registerField, label: copy.unlockCropTracking },
          { value: weather ? copy.weatherLive : copy.weatherPending, label: copy.weatherLink },
          { value: trendingCrops.length ? copy.marketReady : copy.weatherPending, label: copy.marketFeed }
        ];

    const alerts = [];
    if (farms.length > 0 && weather?.temperature > 35) {
      alerts.push(`${copy.heatAlert}: ${weather.temperature}°C`);
    }
    farms.forEach(farm => {
      if ((farm.progress || 0) > 90) {
        alerts.push(`${farm.name} ${copy.harvestPeak}`);
      }
    });

    const todayActions = [];
    if (farmMetrics.totalFarms === 0) {
      todayActions.push({
        id: 'add-field',
        title: copy.addFirstField,
        detail: copy.addFirstFieldDetail,
        cta: copy.registerField,
        route: '/farms',
        priority: 'high'
      });
    }
    if (weather?.temperature > 35) {
      todayActions.push({
        id: 'heat-action',
        title: copy.heatRiskAction,
        detail: copy.heatRiskDetail,
        cta: copy.viewFarmPlan,
        route: '/farms',
        priority: 'high'
      });
    }
    if (trendingCrops[0]) {
      todayActions.push({
        id: 'market-opportunity',
        title: `${trendingCrops[0].commodity} ${copy.openMarket}`,
        detail: copy.openMarket,
        cta: copy.openMarket,
        route: '/market',
        priority: 'medium'
      });
    }
    todayActions.push({
      id: 'plant-health',
      title: copy.scanPlantHealth,
      detail: copy.scanPlantHealthDetail,
      cta: copy.startScan,
      route: '/doctor',
      priority: 'medium'
    });

    res.json({
      success: true,
      user: {
        name: profile.name || 'Farmer',
        city: profile.city || 'Sonipat',
        state: profile.state || 'Haryana',
        country: profile.country || 'India'
      },
      weather: weather ? {
        ...weather,
        location: profile.city || 'Sonipat'
      } : null,
      metrics: farmMetrics,
      statsCards,
      todayActions: todayActions.slice(0, 3),
      changeInsights: [
        { id: 'fields', text: copy.noFieldsAdded, cta: copy.manageFields, route: '/farms' },
        { id: 'risk', text: weatherStatusType === 'favorable' ? copy.weatherStable : weatherStatus, cta: copy.viewAlerts, route: '/' },
        { id: 'market', text: trendingCrops[0] ? `${trendingCrops[0].commodity} trend: ${String(trendingCrops[0].trend || 'stable')}` : copy.marketPending, cta: copy.openMarket, route: '/market' }
      ],
      insights: {
        cropAdvice,
        irrigationAdvice,
        weatherStatus,
        weatherStatusType
      },
      alerts,
      trendingCrops
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to build dashboard overview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
})

const ASSISTANT_COPY = {
  en: {
    greet: 'I am your FarmEase assistant. Ask me about weather, crops, irrigation, disease risk, or markets.',
    fallback: 'I understood your request. Based on your farm profile, monitor weather, field health, and market prices daily for better yield decisions.',
    weatherLead: 'Current weather near your farm is',
    farmsLead: 'You currently have',
    farmsNone: 'no registered fields',
    farmsOne: '1 registered field',
    farmsMany: 'registered fields',
    marketLead: 'Top nearby mandi by price signal is',
    weatherDetails: (w) => `${w.temperature}°C, humidity ${w.humidity}%, wind ${w.windSpeed} km/h.`,
    nextStepsNone: 'You have not added any field yet. Start by adding one field, then check crop recommendation, and finally compare mandi prices before selling.',
    nextStepsHasFarms: 'For today: check weather risk, review crop health in Plant Doctor if needed, and compare nearby mandi prices before selling.',
    clarify: 'I can help with weather, crop planning, irrigation, mandi prices, and plant disease. Ask a direct question like: "What should I do today?"',
    fieldDetailsLead: 'Here is your field status',
    fieldImproveLead: 'To improve this field',
    cheapestMarketLead: 'Cheapest nearby market for your crop',
    noCropMatch: 'I could not find live crop-wise price match right now. Try syncing market rates and asking again.',
    fertilizerNeedMoreData: 'Without soil test and leaf-color check, use a safe split dose strategy instead of heavy fertilizer at once.',
    noFieldsToDetail: 'You have no registered fields yet. Add your first field and I will track name, crop stage, health, and harvest timeline.',
    actionOpenMarket: 'Open Market',
    actionOpenFarms: 'Open My Fields',
    actionOpenDoctor: 'Open Plant Doctor'
  },
  hi: {
    greet: 'मैं आपका FarmEase सहायक हूँ। मौसम, फसल, सिंचाई, रोग जोखिम या मंडी के बारे में पूछें।',
    fallback: 'मैंने आपका प्रश्न समझा। बेहतर उत्पादन के लिए मौसम, खेत की स्थिति और मंडी कीमतें रोज़ देखें।',
    weatherLead: 'आपके क्षेत्र में वर्तमान मौसम',
    farmsLead: 'आपके पास अभी',
    farmsNone: 'कोई पंजीकृत खेत नहीं है',
    farmsOne: '1 पंजीकृत खेत है',
    farmsMany: 'पंजीकृत खेत हैं',
    marketLead: 'कीमत संकेत के आधार पर पास की टॉप मंडी',
    weatherDetails: (w) => `${w.temperature}°C, आर्द्रता ${w.humidity}%, हवा ${w.windSpeed} किमी/घंटा।`,
    nextStepsNone: 'आपने अभी कोई खेत नहीं जोड़ा है। पहले एक खेत जोड़ें, फिर फसल सिफारिश देखें, और बेचने से पहले मंडी भाव तुलना करें।',
    nextStepsHasFarms: 'आज के लिए: मौसम जोखिम देखें, जरूरत हो तो प्लांट डॉक्टर में फसल स्वास्थ्य जांचें, और बेचने से पहले पास की मंडियों के भाव तुलना करें।',
    clarify: 'मैं मौसम, फसल योजना, सिंचाई, मंडी भाव और पौधा रोग में मदद कर सकता हूँ। जैसे पूछें: "आज मुझे क्या करना चाहिए?"',
    fieldDetailsLead: 'आपके खेत की स्थिति यह है',
    fieldImproveLead: 'इस खेत को बेहतर करने के लिए',
    cheapestMarketLead: 'आपकी फसल के लिए सबसे सस्ती पास की मंडी',
    noCropMatch: 'अभी crop-wise लाइव रेट मैच नहीं मिला। मार्केट में Sync Live Rates करके फिर पूछें।',
    fertilizerNeedMoreData: 'बिना मिट्टी जांच और पत्ती के रंग देखे, एक बार में भारी खाद न दें; split dose सुरक्षित रहेगा।',
    noFieldsToDetail: 'अभी कोई खेत पंजीकृत नहीं है। पहला खेत जोड़ें, फिर मैं नाम, फसल चरण, स्वास्थ्य और कटाई टाइमलाइन बता दूँगा।',
    actionOpenMarket: 'मार्केट खोलें',
    actionOpenFarms: 'मेरे खेत खोलें',
    actionOpenDoctor: 'प्लांट डॉक्टर खोलें'
  },
  te: {
    greet: 'నేను మీ FarmEase సహాయకుడిని. వాతావరణం, పంటలు, నీటి పారుదల, వ్యాధి ప్రమాదం లేదా మార్కెట్ గురించి అడగండి.',
    fallback: 'మీ ప్రశ్న అర్థమైంది. మంచి దిగుబడికి ప్రతిరోజూ వాతావరణం, పొలం ఆరోగ్యం, మార్కెట్ ధరలు చూసండి.',
    weatherLead: 'మీ ప్రాంతంలో ప్రస్తుత వాతావరణం',
    farmsLead: 'మీ వద్ద ప్రస్తుతం',
    farmsNone: 'నమోదైన పొలాలు లేవు',
    farmsOne: '1 నమోదైన పొలం ఉంది',
    farmsMany: 'నమోదైన పొలాలు ఉన్నాయి',
    marketLead: 'ధర సంకేతం ఆధారంగా దగ్గరలోని టాప్ మార్కెట్',
    weatherDetails: (w) => `${w.temperature}°C, ఆర్ద్రత ${w.humidity}%, గాలి వేగం ${w.windSpeed} కి.మీ/గంట.`,
    nextStepsNone: 'మీరు ఇంకా ఏ పొలం జోడించలేదు. ముందుగా ఒక పొలం జోడించి, తర్వాత పంట సిఫార్సు చూడండి, అమ్మే ముందు మార్కెట్ ధరలు పోల్చండి.',
    nextStepsHasFarms: 'ఈ రోజు కోసం: వాతావరణ ప్రమాదం చూడండి, అవసరమైతే ప్లాంట్ డాక్టర్‌లో ఆరోగ్యం చెక్ చేయండి, అమ్మే ముందు సమీప మార్కెట్ ధరలు పోల్చండి.',
    clarify: 'వాతావరణం, పంట ప్రణాళిక, నీటిపారుదల, మార్కెట్ ధరలు, మొక్కల వ్యాధిపై నేను సహాయం చేస్తాను. ఇలా అడగండి: "ఈ రోజు నేను ఏం చేయాలి?"',
    fieldDetailsLead: 'మీ పొలం స్థితి ఇలా ఉంది',
    fieldImproveLead: 'ఈ పొలాన్ని మెరుగుపరచడానికి',
    cheapestMarketLead: 'మీ పంటకు దగ్గరలో అతి తక్కువ ధర ఉన్న మార్కెట్',
    noCropMatch: 'ఇప్పుడే crop-wise లైవ్ ధర మ్యాచ్ దొరకలేదు. మార్కెట్‌లో Sync Live Rates చేసి మళ్లీ అడగండి.',
    fertilizerNeedMoreData: 'మట్టి పరీక్ష/ఆకు రంగు సమాచారం లేకుండా ఒకేసారి ఎక్కువ ఎరువు వేయకండి; split dose సురక్షితం.',
    noFieldsToDetail: 'ఇప్పటివరకు నమోదు చేసిన పొలాలు లేవు. మొదటి పొలం జోడిస్తే పేరు, దశ, ఆరోగ్యం, కోత సమయం వివరంగా చెబుతాను.',
    actionOpenMarket: 'మార్కెట్ తెరవండి',
    actionOpenFarms: 'నా పొలాలు తెరవండి',
    actionOpenDoctor: 'ప్లాంట్ డాక్టర్ తెరవండి'
  }
}

const detectAssistantLang = (message, requestedLang) => {
  const req = String(requestedLang || 'en').toLowerCase().split('-')[0]
  const text = String(message || '').trim()
  const lower = text.toLowerCase()

  if (/[\u0900-\u097f]/.test(text)) return 'hi'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'

  if (/\b(hindi|hindime|hindi me|mujhe|mera|kya|kaise|kripya|mandi|fasal|barish|mausam)\b/i.test(lower)) {
    return 'hi'
  }
  if (/\b(telugu|naku|naaku|meeru|ela|emiti|pant|vyavasayam)\b/i.test(lower)) {
    return 'te'
  }
  return ['en', 'hi', 'te'].includes(req) ? req : 'en'
}

app.post('/api/assistant/chat', authenticateToken, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim()
    const lang = detectAssistantLang(message, req.body?.lang || req.headers['x-language'] || 'en')
    const copy = ASSISTANT_COPY[lang] || ASSISTANT_COPY.en

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' })
    }

    const [users] = await db.query(
      'SELECT city, state, latitude, longitude FROM users WHERE id = ?',
      [req.user.userId]
    )
    const profile = users?.[0] || {}
    const farms = await getUserFarms(req.user.userId)
    const primaryFarm = farms[0] || null

    const lat = Number(profile.latitude || req.body?.lat || 0)
    const lng = Number(profile.longitude || req.body?.lng || 0)

    let weather = null
    if (lat && lng) {
      weather = await fetchCurrentWeather(lat, lng)
    }

    let topMarket = null
    let nearbyMarkets = []
    if (lat && lng) {
      try {
        const marketsResult = await integratedMarketService.getVerifiedMarketsWithPrices(lat, lng, 50)
        const markets = Array.isArray(marketsResult?.markets) ? marketsResult.markets : []
        nearbyMarkets = markets
        const live = markets.filter(m => Number(m.avgPrice || 0) > 0)
        topMarket = live.length ? live.sort((a, b) => Number(b.avgPrice || 0) - Number(a.avgPrice || 0))[0] : null
      } catch {
        topMarket = null
        nearbyMarkets = []
      }
    }

    const text = message.toLowerCase()
    const normalizeCrop = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const normalizeLoose = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f\u0C00-\u0C7F]/g, '')
    const pickTargetFarm = () => {
      if (!farms.length) return null
      const q = normalizeLoose(message)
      for (const farm of farms) {
        const fname = normalizeLoose(farm.name || '')
        if (fname && q.includes(fname)) return farm
      }
      return farms[0]
    }
    const findCheapestCropMarket = (targetCrop) => {
      const target = normalizeCrop(targetCrop)
      if (!target) return null
      const candidates = []
      nearbyMarkets.forEach((market) => {
        ;(market.commodities || []).forEach((c) => {
          const commodity = String(c.commodity || '')
          const key = normalizeCrop(commodity)
          if (!key) return
          if (key.includes(target) || target.includes(key)) {
            const price = Number(c.modal_price || c.modalPrice || market.avgPrice || 0)
            if (price > 0) {
              candidates.push({
                marketName: market.name,
                crop: commodity,
                price,
                distance: Number(market.distance || 0)
              })
            }
          }
        })
      })
      if (!candidates.length) return null
      candidates.sort((a, b) => a.price - b.price || a.distance - b.distance)
      return candidates[0]
    }

    const buildFarmDetailsReply = () => {
      if (!primaryFarm) return `${copy.farmsLead} ${copy.farmsNone}.`
      const fieldName = primaryFarm.name || (lang === 'hi' ? 'आपका खेत' : lang === 'te' ? 'మీ పొలం' : 'your field')
      const crop = primaryFarm.crop || (lang === 'hi' ? 'फसल जानकारी नहीं' : lang === 'te' ? 'పంట సమాచారం లేదు' : 'unknown crop')
      const area = Number(primaryFarm.area || 0)
      const health = Number(primaryFarm.health_score || 0)
      const progress = Number(primaryFarm.progress || 0)
      const daysToHarvest = Number(primaryFarm.days_to_harvest || 0)

      const improvements = []
      if (health > 0 && health < 70) {
        improvements.push(lang === 'hi'
          ? 'खेत स्वास्थ्य कम है, पोषण/रोग जांच के लिए Plant Doctor चलाएँ'
          : lang === 'te'
            ? 'పొలం ఆరోగ్యం తక్కువగా ఉంది, పోషకాలు/వ్యాధి కోసం Plant Doctor ఉపయోగించండి'
            : 'Field health is low, run Plant Doctor for nutrition/disease checks')
      }
      if (progress < 35) {
        improvements.push(lang === 'hi'
          ? 'शुरुआती वृद्धि चरण है, हल्की और नियमित सिंचाई रखें'
          : lang === 'te'
            ? 'ఇది ప్రారంభ దశ పెరుగుదల, తేలికపాటి రెగ్యులర్ నీటిపారుదల చేయండి'
            : 'Early growth stage, keep light and regular irrigation')
      } else if (progress >= 80) {
        improvements.push(lang === 'hi'
          ? 'कटाई नज़दीक है, मंडी भाव रोज़ तुलना करें'
          : lang === 'te'
            ? 'కోత సమీపంలో ఉంది, మార్కెట్ ధరలు రోజూ పోల్చండి'
            : 'Harvest is near, compare mandi rates daily')
      }
      if (weather?.temperature > 34) {
        improvements.push(lang === 'hi'
          ? 'तापमान अधिक है, सुबह/शाम सिंचाई और दोपहर में खेत निरीक्षण कम करें'
          : lang === 'te'
            ? 'ఉష్ణోగ్రత ఎక్కువగా ఉంది, ఉదయం/సాయంత్రం నీరు పెట్టండి'
            : 'High temperature: irrigate in morning/evening')
      }
      if (!improvements.length) {
        improvements.push(lang === 'hi'
          ? 'स्वास्थ्य अच्छा रखने के लिए सिंचाई, रोग जांच और मंडी मॉनिटरिंग नियमित रखें'
          : lang === 'te'
            ? 'ఆరోగ్యం బాగుండటానికి నీటిపారుదల, వ్యాధి చెక్, మార్కెట్ మానిటరింగ్ కొనసాగించండి'
            : 'Maintain regular irrigation, disease checks, and market monitoring')
      }

      if (lang === 'hi') {
        return `${copy.fieldDetailsLead}: ${fieldName} • फसल: ${crop} • क्षेत्र: ${area} एकड़ • स्वास्थ्य: ${health || 'N/A'}% • वृद्धि: ${progress || 0}% • कटाई: ${daysToHarvest || 'N/A'} दिन। ${copy.fieldImproveLead}: ${improvements.slice(0, 3).join('। ')}।`
      }
      if (lang === 'te') {
        return `${copy.fieldDetailsLead}: ${fieldName} • పంట: ${crop} • విస్తీర్ణం: ${area} ఎకరాలు • ఆరోగ్యం: ${health || 'N/A'}% • పురోగతి: ${progress || 0}% • కోత: ${daysToHarvest || 'N/A'} రోజులు. ${copy.fieldImproveLead}: ${improvements.slice(0, 3).join('. ')}.`
      }
      return `${copy.fieldDetailsLead}: ${fieldName} • Crop: ${crop} • Area: ${area} acres • Health: ${health || 'N/A'}% • Progress: ${progress || 0}% • Harvest in: ${daysToHarvest || 'N/A'} days. ${copy.fieldImproveLead}: ${improvements.slice(0, 3).join('. ')}.`
    }

    const buildAllFieldsReply = (mode = 'summary') => {
      if (!farms.length) return copy.noFieldsToDetail

      const describeOne = (field, idx) => {
        const name = field.name || (lang === 'hi' ? `खेत ${idx + 1}` : lang === 'te' ? `పొలం ${idx + 1}` : `Field ${idx + 1}`)
        const crop = field.crop || (lang === 'hi' ? 'फसल अज्ञात' : lang === 'te' ? 'పంట తెలియదు' : 'unknown crop')
        const health = Number(field.health_score || 0)
        const progress = Number(field.progress || 0)
        const harvest = Number(field.days_to_harvest || 0)
        if (mode === 'names') {
          return lang === 'hi'
            ? `${name} (${crop})`
            : lang === 'te'
              ? `${name} (${crop})`
              : `${name} (${crop})`
        }
        if (mode === 'status') {
          return lang === 'hi'
            ? `${name}: ${crop}, स्वास्थ्य ${health || 'N/A'}%, प्रगति ${progress || 0}%, कटाई ${harvest || 'N/A'} दिन`
            : lang === 'te'
              ? `${name}: ${crop}, ఆరోగ్యం ${health || 'N/A'}%, పురోగతి ${progress || 0}%, కోత ${harvest || 'N/A'} రోజులు`
              : `${name}: ${crop}, health ${health || 'N/A'}%, progress ${progress || 0}%, harvest in ${harvest || 'N/A'} days`
        }
        return lang === 'hi'
          ? `${name} में ${crop} है (प्रगति ${progress || 0}%, स्वास्थ्य ${health || 'N/A'}%)`
          : lang === 'te'
            ? `${name}లో ${crop} ఉంది (పురోగతి ${progress || 0}%, ఆరోగ్యం ${health || 'N/A'}%)`
            : `${name} has ${crop} (progress ${progress || 0}%, health ${health || 'N/A'}%)`
      }

      const top = farms.slice(0, 4).map(describeOne)
      const lowHealth = farms.filter(f => Number(f.health_score || 100) < 70).length
      const nearHarvest = farms.filter(f => Number(f.progress || 0) >= 80).length

      if (mode === 'names') {
        if (lang === 'hi') return `आपके ${farms.length} पंजीकृत खेत हैं: ${top.join(', ')}।`
        if (lang === 'te') return `మీకు ${farms.length} నమోదైన పొలాలు ఉన్నాయి: ${top.join(', ')}.`
        return `You have ${farms.length} registered fields: ${top.join(', ')}.`
      }

      if (mode === 'status') {
        const hints = []
        if (lowHealth > 0) {
          hints.push(
            lang === 'hi'
              ? `${lowHealth} खेतों का स्वास्थ्य कम है, पहले उन्हें देखें।`
              : lang === 'te'
                ? `${lowHealth} పొలాల్లో ఆరోగ్యం తక్కువగా ఉంది, ముందు వాటిని చూడండి.`
                : `${lowHealth} field(s) have low health; check them first.`
          )
        }
        if (nearHarvest > 0) {
          hints.push(
            lang === 'hi'
              ? `${nearHarvest} खेत कटाई के करीब हैं, मार्केट रेट मॉनिटर करें।`
              : lang === 'te'
                ? `${nearHarvest} పొలాలు కోత దశలో ఉన్నాయి, మార్కెట్ రేట్లు చూసండి.`
                : `${nearHarvest} field(s) are near harvest; monitor market rates.`
          )
        }
        const suffix = hints.length
          ? (lang === 'hi'
            ? `प्राथमिक सुझाव: ${hints.join(' ')}`
            : lang === 'te'
              ? `ప్రాధాన్య సూచన: ${hints.join(' ')}`
              : `Priority: ${hints.join(' ')}`)
          : ''
        return `${top.join('. ')}.${suffix ? ` ${suffix}` : ''}`
      }

      return top.join('. ') + '.'
    }

    const buildFertilizerReply = () => {
      const targetFarm = pickTargetFarm()
      if (!targetFarm) return `${copy.farmsLead} ${copy.farmsNone}.`
      const crop = targetFarm.crop || 'crop'
      const fieldName = targetFarm.name || (lang === 'hi' ? 'आपका खेत' : lang === 'te' ? 'మీ పొలం' : 'your field')
      const progress = Number(targetFarm.progress || 0)
      const hotDry = (weather?.temperature || 0) >= 34 && (weather?.humidity || 100) <= 35

      if (lang === 'hi') {
        if (progress <= 30) {
          return `${fieldName} (${crop}) में अभी शुरुआती चरण (${progress}%) है। हल्की split dose दें: जैविक खाद + संतुलित NPK की कम मात्रा। ${hotDry ? 'गर्मी/शुष्क मौसम है, खाद शाम को सिंचाई के साथ दें।' : 'खाद देने के बाद हल्की सिंचाई रखें।'} ${copy.fertilizerNeedMoreData}`
        }
        if (progress <= 70) {
          return `${fieldName} (${crop}) मध्य चरण (${progress}%) में है। हाँ, जरूरत हो सकती है लेकिन भारी मात्रा एक साथ न दें। पत्तियाँ पीली/वृद्धि धीमी हो तो छोटी split dose दें। ${hotDry ? 'गर्मी में शाम को ही दें और सिंचाई रखें।' : ''} ${copy.fertilizerNeedMoreData}`
        }
        return `${fieldName} (${crop}) देर चरण (${progress}%) में है। अभी भारी नाइट्रोजन खाद से बचें; केवल deficiency दिखे तो सीमित मात्रा दें। ${copy.fertilizerNeedMoreData}`
      }

      if (lang === 'te') {
        if (progress <= 30) {
          return `${fieldName} (${crop}) ప్రస్తుతం ప్రారంభ దశలో ఉంది (${progress}%). తక్కువ split dose ఇవ్వండి: సేంద్రీయ ఎరువు + సమతుల NPK చిన్న మోతాదు. ${hotDry ? 'వేడి/ఎండగా ఉంది, సాయంత్రం నీటితో కలిపి ఎరువు ఇవ్వండి.' : 'ఎరువు తర్వాత తేలికపాటి నీరు ఇవ్వండి.'} ${copy.fertilizerNeedMoreData}`
        }
        if (progress <= 70) {
          return `${fieldName} (${crop}) మధ్య దశలో ఉంది (${progress}%). అవును, అవసరం ఉండొచ్చు కానీ ఒకేసారి ఎక్కువ ఎరువు వేయొద్దు. ఆకులు వెలిసితే/పెరుగుదల నెమ్మదిగా ఉంటే చిన్న split dose ఇవ్వండి. ${hotDry ? 'వేడి ఉన్నప్పుడు సాయంత్రం మాత్రమే ఇవ్వండి.' : ''} ${copy.fertilizerNeedMoreData}`
        }
        return `${fieldName} (${crop}) చివరి దశలో ఉంది (${progress}%). భారీ నైట్రోజన్ ఎరువును తగ్గించండి; deficiency ఉంటే మాత్రమే పరిమిత మోతాదు ఇవ్వండి. ${copy.fertilizerNeedMoreData}`
      }

      if (progress <= 30) {
        return `${fieldName} (${crop}) is in early stage (${progress}%). Use a light split dose: organic manure plus a small balanced NPK dose. ${hotDry ? 'Because weather is hot/dry, apply in evening with irrigation.' : 'Keep light irrigation after application.'} ${copy.fertilizerNeedMoreData}`
      }
      if (progress <= 70) {
        return `${fieldName} (${crop}) is in mid stage (${progress}%). Fertilizer may be needed, but avoid one heavy dose. If leaves are pale or growth is slow, use a small split dose. ${hotDry ? 'Apply in evening due to hot/dry weather.' : ''} ${copy.fertilizerNeedMoreData}`
      }
      return `${fieldName} (${crop}) is in late stage (${progress}%). Avoid heavy nitrogen now; use only limited corrective dose if deficiency is visible. ${copy.fertilizerNeedMoreData}`
    }
    let reply = copy.fallback
    let action = null

    const hasFarmWord = /(farm|farms|field|fields|fild|filds|feeld|feelds|feel|feels|registered field|registered fields|my crop field|खेत|खेतों|फील्ड|फील्ड्स|फिल्ड|फिल्ड्स|పొలం|పొలాలు|ఫీల్డ్|ఫీల్డ్స్)/i.test(text)
    const hasNameWord = /(name|names|ka naam|naam|क्या नाम|कौन से खेत|fields names|पेर|पेऱ|పేరు|పేర్లు|what are the.*fields)/i.test(text)
    const hasStatusWord = /(status|health|progress|harvest|स्थिति|हालत|growth|अवस्था|స్టేటస్|స్థితి|పురోగతి|ఆరోగ్యం)/i.test(text)
    const hasCountWord = /(how many|kitne|kitni|kitna|कितने|कितनी|कितना|मेरे पास.*कित|mere pass.*kit|mere paas.*kit|ఎన్ని|number of|count|हाउ.*फील्ड|हाउ.*खेत|मान्य.*फील्ड|आई हैव.*फील्ड|i have.*field)/i.test(text)
    const hasActionTodayWord = /(today|now|what should i do|क्या करूं|आज मुझे क्या|मैं अभी क्या|अब क्या|ఏం చేయాలి|kya karu|kya karun|main abhi kya|mai abhi kya)/i.test(text)

    if (/(speak in hindi|reply in hindi|hindi me bolo|hindi mein bolo|hindi me baat)/i.test(text)) {
      reply = 'ठीक है, अब मैं हिंदी में जवाब दूँगा। आप पूछें।'
    } else if (/(speak in telugu|reply in telugu|telugu lo matlaadu|telugu lo cheppu|telugu lo)/i.test(text)) {
      reply = 'సరే, ఇకపై నేను తెలుగులో సమాధానం ఇస్తాను. అడగండి.'
    } else if (/(speak in english|reply in english)/i.test(text)) {
      reply = 'Sure, I will reply in English now.'
    } else if (/\b(hello|hi|hey)\b|namaste|నమస్తే|హలో|नमस्ते/i.test(message)) {
      reply = copy.greet
    } else if (/(weather|बारिश|मौसम|వాతావరణ|rain|temperature|temp)/i.test(text)) {
      if (weather) {
        reply = `${copy.weatherLead} ${copy.weatherDetails(weather)}`
      } else {
        reply = copy.fallback
      }
    } else if (/(kya karu|kya karun|what should i do|क्या करूं|अब क्या|ఏం చేయాలి|em cheyali)/i.test(text)) {
      if (farms.length > 0) {
        reply = copy.nextStepsHasFarms
        action = { label: copy.actionOpenFarms, route: '/farms' }
      } else {
        reply = copy.nextStepsNone
        action = { label: copy.actionOpenFarms, route: '/farms' }
      }
    } else if (hasFarmWord && hasNameWord) {
      reply = buildAllFieldsReply('names')
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (hasFarmWord && hasStatusWord) {
      reply = buildAllFieldsReply('status')
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (hasFarmWord && hasCountWord) {
      const farmsText = farms.length === 0
        ? copy.farmsNone
        : farms.length === 1
          ? copy.farmsOne
          : `${farms.length} ${copy.farmsMany}`
      reply = `${copy.farmsLead} ${farmsText}.`
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (/(tell me about|about that field|field status|my field details|farm details|खेत की स्थिति|उस खेत|field idea|farm status)/i.test(text)) {
      reply = buildFarmDetailsReply()
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (/(what should i add|what to add|should i add|क्या डाल|क्या add|में क्या डाल|dalu|dalun|dal sakti|add to .* crop|add .* field)/i.test(text)) {
      reply = buildFertilizerReply()
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (/(fertilizer|fertiliser|urea|npk|dap|potash|खाद|उर्वरक|khaad|ఫర్టిలైజర్|ఎరువు|फर्टिलाइज|फर्टिलाइजर|फर्टिलाइजर्स|ferti|डाल सकती|कुछ डाल)/i.test(text)) {
      reply = buildFertilizerReply()
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (/(best market|best marketplace|cheapest|lowest price|सस्ती मंडी|सबसे सस्ता|lowest mandi|cheap market|best mandi|మార్కెట్|చౌక|అత్యల్ప ధర)/i.test(text)) {
      const cropFromMessage = (() => {
        if (primaryFarm?.crop && /(my crop|मेरी फसल|నా పంట|that crop|उस फसल)/i.test(text)) return primaryFarm.crop
        const direct = (text.match(/for\s+([a-zA-Z]+)/)?.[1] || '').trim()
        return direct || primaryFarm?.crop || null
      })()
      const cheapest = cropFromMessage ? findCheapestCropMarket(cropFromMessage) : null
      if (cheapest) {
        reply = lang === 'hi'
          ? `${copy.cheapestMarketLead} ${cheapest.marketName} है (${cheapest.crop}: ₹${Number(cheapest.price).toLocaleString('en-IN')}, ${cheapest.distance} km).`
          : lang === 'te'
            ? `${copy.cheapestMarketLead} ${cheapest.marketName} (${cheapest.crop}: ₹${Number(cheapest.price).toLocaleString('en-IN')}, ${cheapest.distance} కి.మీ).`
            : `${copy.cheapestMarketLead} is ${cheapest.marketName} (${cheapest.crop}: ₹${Number(cheapest.price).toLocaleString('en-IN')}, ${cheapest.distance} km).`
      } else if (topMarket) {
        reply = `${copy.marketLead} ${topMarket.name} (₹${Number(topMarket.avgPrice || 0).toLocaleString('en-IN')}).`
      } else {
        reply = copy.noCropMatch
      }
      action = { label: copy.actionOpenMarket, route: '/market' }
    } else if (/(farm|field|खेत|పొలం|my field)/i.test(text) && !/(market|mandi|price|sell|fertilizer|fertiliser|खाद|उर्वरक|ఎరువు|best marketplace|best market|cheapest)/i.test(text)) {
      const farmsText = farms.length === 0
        ? copy.farmsNone
        : farms.length === 1
          ? copy.farmsOne
          : `${farms.length} ${copy.farmsMany}`
      reply = `${copy.farmsLead} ${farmsText}.`
      action = { label: copy.actionOpenFarms, route: '/farms' }
    } else if (/(market|mandi|price|sell|बाज़ार|मंडी|మార్కెట్|ధర)/i.test(text)) {
      if (topMarket) {
        reply = `${copy.marketLead} ${topMarket.name} (₹${Number(topMarket.avgPrice || 0).toLocaleString('en-IN')}).`
      } else {
        reply = copy.noCropMatch
      }
      action = { label: copy.actionOpenMarket, route: '/market' }
    } else if (/(crop|which crop|recommend|फसल|कौन सी फसल|పంట|ఏ పంట)/i.test(text)) {
      if (weather?.temperature > 30) {
        reply = lang === 'hi'
          ? 'मौजूदा तापमान के हिसाब से गर्मी सहनशील फसलें बेहतर रहेंगी, जैसे मक्का, भिंडी या बाजरा।'
          : lang === 'te'
            ? 'ప్రస్తుత ఉష్ణోగ్రతను బట్టి వేడిని తట్టుకునే పంటలు మంచివి, ఉదాహరణకు మొక్కజొన్న, బెండకాయ లేదా సజ్జలు.'
            : 'Based on current temperature, heat-tolerant crops like maize, okra, or millet are safer options.'
      } else {
        reply = lang === 'hi'
          ? 'मौसम के हिसाब से ठंड-सहनशील फसलें उपयुक्त हैं, जैसे पत्ता गोभी, गाजर या पालक।'
          : lang === 'te'
            ? 'ప్రస్తుత వాతావరణాన్ని బట్టి చల్లదనాన్ని తట్టుకునే పంటలు అనుకూలం, ఉదాహరణకు క్యాబేజీ, క్యారెట్ లేదా పాలకూర.'
            : 'Given current weather, cooler-season crops like cabbage, carrot, or spinach are suitable.'
      }
      action = { label: copy.actionOpenFarms, route: '/crop-recommendation' }
    } else if (/(disease|doctor|plant|रोग|डॉक्टर|వ్యాధి|డాక్టర్)/i.test(text)) {
      reply = copy.clarify
      action = { label: copy.actionOpenDoctor, route: '/doctor' }
    } else {
      // Only show "today action" guidance for explicit action-type prompts.
      if (hasActionTodayWord) {
        if (farms.length === 0) {
          reply = copy.nextStepsNone
          action = { label: copy.actionOpenFarms, route: '/farms' }
        } else if (weather) {
          reply = `${copy.nextStepsHasFarms} ${copy.weatherLead} ${copy.weatherDetails(weather)}`
        } else {
          reply = copy.nextStepsHasFarms
        }
      } else {
        // For ambiguous/incomplete phrasing (e.g. "what are the"), avoid weather fallback.
        reply = copy.clarify
      }
    }

    res.json({
      success: true,
      reply,
      lang,
      action
    })
  } catch (error) {
    console.error('Assistant chat error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process assistant request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})







app.post('/api/farms', authenticateToken, async (req, res) => {
  try {
    console.log('📝 POST /api/farms - Request body:', req.body)
    console.log('📝 POST /api/farms - User ID:', req.user?.userId)
    
    const { name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location } = req.body

    if (!name || !crop || !area) {
      console.log('❌ POST /api/farms - Missing required fields:', { name: !!name, crop: !!crop, area: !!area })
      return res.status(400).json({ error: 'Name, crop, and area are required' })
    }

    console.log('📝 POST /api/farms - Creating farm with:', { name, crop, area, soilType, plantingDate })
    
    const result = await createFarm(req.user.userId, {
      name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location
    })

    console.log('✅ POST /api/farms - Farm created:', result)
    res.json({ success: true, farmId: result.insertId })
  } catch (error) {
    console.error('❌ Create farm error:', error)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to create farm', details: error.message })
  }
})

app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const [activities] = await db.query(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC',
      [req.user.userId]
    )
    res.json(activities)
  } catch (error) {
    console.error('Fetch activities error:', error)
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
})

app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { farmId, type, details, quantity, date } = req.body

    if (!type || !date) {
      return res.status(400).json({ error: 'Type and date are required' })
    }

    const [result] = await db.execute(
      'INSERT INTO activities (user_id, farm_id, type, details, quantity, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, farmId, type, details, quantity, date]
    )

    res.json({ success: true, activityId: result.insertId })
  } catch (error) {
    console.error('Create activity error:', error)
    res.status(500).json({ error: 'Failed to create activity' })
  }
})

app.get('/api/forum/posts', async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.name as author_name 
      FROM forum_posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC 
      LIMIT 50
    `)
    res.json(posts)
  } catch (error) {
    console.error('Fetch posts error:', error)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

app.post('/api/forum/posts', authenticateToken, async (req, res) => {
  try {
    const { content, tags } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const [result] = await db.execute(
      'INSERT INTO forum_posts (user_id, content, tags) VALUES (?, ?, ?)',
      [req.user.userId, content, JSON.stringify(tags || [])]
    )
    res.json({ success: true, postId: result.insertId })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

app.post('/api/forum/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    // In a real app, we would check if user already liked it in a separate table
    // For now, just increment the counter
    await db.execute(
      'UPDATE forum_posts SET likes = likes + 1 WHERE id = ?',
      [req.params.id]
    )
    res.json({ success: true })
  } catch (error) {
    console.error('Like post error:', error)
    res.status(500).json({ error: 'Failed to like post' })
  }
})

app.post('/api/plant-diagnosis', authenticateToken, async (req, res) => {
  try {
    const { disease, confidence, symptoms, remedy, type, image_url } = req.body

    if (!disease || !confidence) {
      return res.status(400).json({ error: 'Disease and confidence are required' })
    }

    const [result] = await db.execute(
      'INSERT INTO plant_diagnoses (user_id, disease, confidence, symptoms, remedy, type, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, disease, confidence, JSON.stringify(symptoms), remedy, type, image_url]
    )

    res.json({ success: true, diagnosisId: result.insertId })
  } catch (error) {
    console.error('Create diagnosis error:', error)
    res.status(500).json({ error: 'Failed to save diagnosis' })
  }
})

app.get('/api/plant-diagnosis/history', authenticateToken, async (req, res) => {
  try {
    const [diagnoses] = await db.query(
      'SELECT * FROM plant_diagnoses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.userId]
    )
    res.json(diagnoses)
  } catch (error) {
    console.error('Fetch diagnosis history error:', error)
    res.status(500).json({ error: 'Failed to fetch diagnosis history' })
  }
})

// Market Data Cache (TTL: 10 minutes)
const marketCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// ==================== LOCATION API ====================
// Get list of cities/districts with market summaries
app.get('/api/market/cities', async (req, res) => {
  try {
    let { lat, lng } = req.query
    if (!lat || !lng) {
      return res.status(400).json({
        locationRequired: true,
        error: 'Location coordinates are required to fetch nearby cities'
      })
    }

    lat = parseFloat(lat)
    lng = parseFloat(lng)

    // Resolve City with fallbacks
    let city = 'Detected Location'
    let state = 'Unknown'
    let country = 'India'

    try {
      const API_KEY = process.env.OPENWEATHER_API_KEY
      if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not configured')
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          limit: 1,
          appid: API_KEY
        },
        timeout: 5000
      }
      )

      if (response.data && response.data.length > 0) {
        city = response.data[0].name
        state = response.data[0].state || 'Unknown'
        country = response.data[0].country === 'IN' ? 'India' : response.data[0].country === 'US' ? 'USA' : 'Global'
      } else {
        throw new Error('No results from OWM')
      }
    } catch (geoError) {
      console.warn('⚠️ OWM Reverse geocoding failed in market/cities, falling back to BigDataCloud:', geoError.message)
      try {
        const response = await axios.get(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { timeout: 5000 }
        )
        if (response.data) {
          city = response.data.city || response.data.locality || response.data.principalSubdivision || 'Detected Location'
          state = response.data.principalSubdivision || 'Unknown'
          country = response.data.countryName || 'India'
        }
      } catch (fallbackError) {
        console.error('❌ BigDataCloud fallback geocoding failed in market/cities:', fallbackError.message)
      }
    }

    const provider = getProvider(country)
    const marketData = await provider.fetchMarketData({ city, lat, lng })

    // Group by city (in this case, just one, but structure allows more)
    const citiesMap = {}
    marketData.forEach(item => {
      if (!citiesMap[item.district]) {
        citiesMap[item.district] = {
          city: item.district,
          state: item.state,
          lat: item.lat,
          lng: item.lng,
          distanceKm: 0, // Current city
          majorCrops: [],
          avgPrice: 0,
          trend: 'stable'
        }
      }
      if (!citiesMap[item.district].majorCrops.includes(item.commodity)) {
        citiesMap[item.district].majorCrops.push(item.commodity)
      }
    })

    const cities = Object.values(citiesMap)
    res.json(cities)

  } catch (error) {
    console.error('Fetch cities error:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

// Get detailed markets for a specific city
app.get('/api/market/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params

    if (!cityName || cityName === 'undefined' || cityName === 'null') {
      return res.status(400).json({ error: 'City name is required to fetch market data' })
    }

    // Resolve Country and Coordinates from City Name
    let country = 'India'
    let lat = 0, lng = 0
    let state = 'Unknown'

    try {
      const API_KEY = process.env.OPENWEATHER_API_KEY
      if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not configured')
      const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
        params: { q: cityName, limit: 1, appid: API_KEY },
        timeout: 5000
      })

      if (geoRes.data && geoRes.data.length > 0) {
        lat = geoRes.data[0].lat
        lng = geoRes.data[0].lon
        country = geoRes.data[0].country === 'IN' ? 'India' : geoRes.data[0].country === 'US' ? 'USA' : 'Global'
        state = geoRes.data[0].state || 'Unknown'
      } else {
        // Fallback to Open-Meteo Geocoding
        const fallbackRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`, { timeout: 5000 })
        if (fallbackRes.data.results && fallbackRes.data.results.length > 0) {
          const result = fallbackRes.data.results[0]
          lat = result.latitude
          lng = result.longitude
          country = result.country_code === 'IN' ? 'India' : result.country_code === 'US' ? 'USA' : 'Global'
          state = result.admin1 || 'Unknown'
        }
      }
    } catch (e) {
      console.error('City resolution error:', e.message)
    }

    const provider = getProvider(country)
    const marketData = await provider.fetchMarketData({ city: cityName, district: cityName, state, lat, lng })

    if (!marketData || marketData.length === 0) {
      return res.status(404).json({ error: `No market data found for city: ${cityName}` })
    }

    res.json({
      city: cityName,
      state: marketData[0].state || 'Unknown',
      markets: marketData
    })

  } catch (error) {
    console.error('Market city details error:', error)
    res.status(500).json({ error: 'Failed to fetch market details' })
  }
})

// Get historical trends for Advanced Page
// Get historical trends for Advanced Page
app.get('/api/market/trends', async (req, res) => {
  try {
    const { crop, city } = req.query

    // Default to India provider for trends if not specified
    const provider = getProvider('India');

    if (provider.fetchTrends) {
      const history = await provider.fetchTrends({ city, crop });

      return res.json([{
        commodity: crop || 'Unknown',
        market: city || 'Unknown',
        history: history
      }]);
    }

    res.status(501).json({ error: 'Trends not supported by this provider' })
  } catch (error) {
    console.error('Market trends error:', error)
    res.status(500).json({ error: 'Failed to fetch market trends' })
  }
})

// Search markets and crops
app.get('/api/market/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])

    const query = `
      SELECT * FROM market_prices 
      WHERE commodity LIKE ? OR market LIKE ? OR variety LIKE ?
      LIMIT 50
    `
    const pattern = `%${q}%`
    const [results] = await db.query(query, [pattern, pattern, pattern])

    res.json(results)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})



// Simple test endpoint
app.get('/api/simple-test', (req, res) => {
  console.log('✅ Simple test endpoint hit')
  res.json({ message: 'Simple test works' })
})

// Helper function for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const DASHBOARD_I18N = {
  en: {
    setupComplete: 'Setup Complete',
    unlockCropTracking: 'Unlock Crop Tracking',
    weatherLink: 'Weather Link',
    marketFeed: 'Market Feed',
    totalFarms: 'Total Farms',
    activeCrops: 'Active Crops',
    harvestReady: 'Harvest Ready',
    healthScore: 'Health Score',
    addFirstField: 'Add your first field',
    addFirstFieldDetail: 'Start tracking crop progress and harvest timelines.',
    registerField: 'Register Field',
    heatRiskAction: 'Heat risk action required',
    heatRiskDetail: 'Delay fertilizer and schedule evening irrigation.',
    viewFarmPlan: 'View Farm Plan',
    openMarket: 'Open Market',
    scanPlantHealth: 'Scan plant health today',
    scanPlantHealthDetail: 'Run Plant Doctor for early disease detection.',
    startScan: 'Start Scan',
    noFieldsAdded: 'No new fields added',
    manageFields: 'Manage Fields',
    weatherStable: 'Weather risk stable',
    viewAlerts: 'View Alerts',
    marketPending: 'Market trend data pending',
    cropCold: 'Cabbage, Carrots, Spinach - Cold-hardy crops recommended',
    cropHeat: 'Maize, Okra, Brinjal - Heat-tolerant crops suggested',
    irrigationModerate: 'Light watering suggested - Moderate conditions',
    irrigationHumidity: 'Low watering suggested - High humidity present',
    irrigationDryHeat: 'Deep watering required - Low soil moisture likely',
    favorable: 'Favorable farming conditions today',
    extremeHeat: 'Extreme Heat Alert - Limit outdoor activities',
    heavyRain: 'Heavy Rain Forecast - Protect sensitive crops',
    highWinds: 'High Winds - Avoid spraying pesticides',
    marketLoading: 'Market data is loading...',
    weatherPending: 'Pending',
    weatherLive: 'Live',
    marketReady: 'Ready',
    heatAlert: 'High heat alert',
    harvestPeak: 'is reaching peak harvest maturity'
  },
  hi: {
    setupComplete: 'सेटअप पूरा',
    unlockCropTracking: 'फसल ट्रैकिंग सक्षम करें',
    weatherLink: 'मौसम लिंक',
    marketFeed: 'बाज़ार फीड',
    totalFarms: 'कुल खेत',
    activeCrops: 'सक्रिय फसलें',
    harvestReady: 'कटाई के लिए तैयार',
    healthScore: 'स्वास्थ्य स्कोर',
    addFirstField: 'अपना पहला खेत जोड़ें',
    addFirstFieldDetail: 'फसल प्रगति और कटाई टाइमलाइन ट्रैक करना शुरू करें।',
    registerField: 'खेत दर्ज करें',
    heatRiskAction: 'गर्मी का जोखिम - तुरंत कार्रवाई',
    heatRiskDetail: 'उर्वरक टालें और शाम को सिंचाई करें।',
    viewFarmPlan: 'खेत योजना देखें',
    openMarket: 'बाज़ार खोलें',
    scanPlantHealth: 'आज पौधे का स्कैन करें',
    scanPlantHealthDetail: 'रोग की जल्दी पहचान के लिए प्लांट डॉक्टर चलाएं।',
    startScan: 'स्कैन शुरू करें',
    noFieldsAdded: 'कोई नया खेत नहीं जोड़ा गया',
    manageFields: 'खेत प्रबंधित करें',
    weatherStable: 'मौसम जोखिम स्थिर है',
    viewAlerts: 'अलर्ट देखें',
    marketPending: 'बाज़ार रुझान डेटा लंबित',
    cropCold: 'पत्ता गोभी, गाजर, पालक - ठंड सहनशील फसलें सुझाई गईं',
    cropHeat: 'मक्का, भिंडी, बैंगन - गर्मी सहनशील फसलें सुझाई गईं',
    irrigationModerate: 'हल्की सिंचाई सुझाई गई - मध्यम स्थिति',
    irrigationHumidity: 'कम सिंचाई सुझाई गई - नमी अधिक है',
    irrigationDryHeat: 'गहरी सिंचाई आवश्यक - मिट्टी में नमी कम',
    favorable: 'आज खेती के लिए अनुकूल परिस्थितियाँ',
    extremeHeat: 'अत्यधिक गर्मी अलर्ट - बाहरी काम सीमित करें',
    heavyRain: 'भारी बारिश का पूर्वानुमान - संवेदनशील फसलें बचाएं',
    highWinds: 'तेज हवा - कीटनाशक छिड़काव न करें',
    marketLoading: 'बाज़ार डेटा लोड हो रहा है...',
    weatherPending: 'लंबित',
    weatherLive: 'सक्रिय',
    marketReady: 'तैयार',
    heatAlert: 'उच्च तापमान अलर्ट',
    harvestPeak: 'कटाई के उच्च चरण में है'
  },
  te: {
    setupComplete: 'సెట్‌ప్ పూర్తైంది',
    unlockCropTracking: 'పంట ట్రాకింగ్ ప్రారంభించండి',
    weatherLink: 'వాతావరణ లింక్',
    marketFeed: 'మార్కెట్ ఫీడ్',
    totalFarms: 'మొత్తం పొలాలు',
    activeCrops: 'సక్రియ పంటలు',
    harvestReady: 'కోతకు సిద్ధం',
    healthScore: 'ఆరోగ్య స్కోర్',
    addFirstField: 'మీ మొదటి పొలం జోడించండి',
    addFirstFieldDetail: 'పంట పురోగతి మరియు కోత టైమ్‌లైన్ ట్రాకింగ్ ప్రారంభించండి.',
    registerField: 'పొలం నమోదు చేయండి',
    heatRiskAction: 'వేడి ప్రమాదం - చర్య అవసరం',
    heatRiskDetail: 'ఎరువు వాయిదా వేసి సాయంత్రం నీరు పెట్టండి.',
    viewFarmPlan: 'ఫారం ప్లాన్ చూడండి',
    openMarket: 'మార్కెట్ తెరవండి',
    scanPlantHealth: 'ఈ రోజు మొక్క ఆరోగ్యం స్కాన్ చేయండి',
    scanPlantHealthDetail: 'రోగాన్ని ముందుగానే గుర్తించడానికి ప్లాంట్ డాక్టర్ ఉపయోగించండి.',
    startScan: 'స్కాన్ ప్రారంభించండి',
    noFieldsAdded: 'కొత్త పొలాలు జోడించలేదు',
    manageFields: 'పొలాలు నిర్వహించండి',
    weatherStable: 'వాతావరణ ప్రమాదం స్థిరంగా ఉంది',
    viewAlerts: 'అలర్ట్స్ చూడండి',
    marketPending: 'మార్కెట్ ట్రెండ్ డేటా పెండింగ్',
    cropCold: 'క్యాబేజీ, క్యారెట్, పాలకూర - చల్లని వాతావరణ పంటలు సూచించబడినవి',
    cropHeat: 'మొక్కజొన్న, బెండకాయ, వంకాయ - వేడి తట్టుకునే పంటలు సూచించబడినవి',
    irrigationModerate: 'తేలికపాటి నీరు - మోస్తరు పరిస్థితులు',
    irrigationHumidity: 'తక్కువ నీరు - ఆర్ద్రత ఎక్కువగా ఉంది',
    irrigationDryHeat: 'లోతైన నీరు అవసరం - నేల తేమ తక్కువగా ఉంది',
    favorable: 'ఈ రోజు వ్యవసాయానికి అనుకూల పరిస్థితులు',
    extremeHeat: 'అత్యధిక ఉష్ణోగ్రత హెచ్చరిక - బయటి పనులు తగ్గించండి',
    heavyRain: 'భారీ వర్ష సూచన - సున్నితమైన పంటలను రక్షించండి',
    highWinds: 'గాలి వేగం ఎక్కువ - పురుగుమందు పిచికారీ నివారించండి',
    marketLoading: 'మార్కెట్ డేటా లోడ్ అవుతోంది...',
    weatherPending: 'పెండింగ్',
    weatherLive: 'లైవ్',
    marketReady: 'సిద్ధం',
    heatAlert: 'అధిక ఉష్ణోగ్రత హెచ్చరిక',
    harvestPeak: 'కోత గరిష్ఠ దశలో ఉంది'
  }
};

const getDashboardCopy = (lang = 'en') => DASHBOARD_I18N[lang] || DASHBOARD_I18N.en;

const fetchCurrentWeather = async (latitude, longitude) => {
  try {
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover&timezone=auto`;
    const response = await axios.get(openMeteoUrl, { timeout: 10000 });
    const current = response?.data?.current;
    if (!current) return null;
    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      rainProb: current.cloud_cover || 0,
      condition: current.weather_code >= 61 ? 'Rain' : current.weather_code >= 45 ? 'Clouds' : 'Clear'
    };
  } catch {
    return null;
  }
};

const buildFallbackNearbyMarkets = async (userLat, userLng, searchRadius) => {
  const provider = getProvider('agmarknet');
  const rawPrices = await provider.fetchMarketData({
    city: 'Sonipat',
    district: 'Sonipat',
    state: 'Haryana',
    lat: userLat,
    lng: userLng
  });

  const grouped = new Map();
  for (const row of rawPrices || []) {
    const key = row.market || row.city || 'Local Mandi';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const markets = Array.from(grouped.entries()).slice(0, 8).map(([name, rows], idx) => {
    const first = rows[0];
    const avgPrice = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + Number(r.modal_price || 0), 0) / rows.length)
      : 0;
    const lat = Number(first.lat || userLat);
    const lng = Number(first.lng || userLng);

    return {
      id: `fallback-${idx}-${String(name).toLowerCase().replace(/\s+/g, '-')}`,
      name,
      lat,
      lng,
      distance: calculateDistance(userLat, userLng, lat, lng) || (idx + 3),
      city: first.district || first.city || 'Sonipat',
      state: first.state || 'Haryana',
      address: `${first.district || 'Sonipat'}, ${first.state || 'Haryana'}`,
      commodities: rows.slice(0, 6).map((r, i) => ({
        id: `${name}-${r.commodity}-${i}`,
        commodity: r.commodity,
        variety: r.variety,
        modal_price: Number(r.modal_price || 0),
        min_price: Number(r.min_price || 0),
        max_price: Number(r.max_price || 0),
        trend: r.trend || 'stable',
        last_updated: r.last_updated || new Date().toISOString()
      })),
      commodityCount: rows.length,
      avgPrice,
      has_live_prices: avgPrice > 0,
      verification_status: 'fallback_market_data',
      last_price_update: rows[0]?.last_updated || new Date().toISOString(),
      price_data_source: 'Agmarknet provider fallback',
      marketType: 'Agricultural Market',
      facilities: [],
      phone: null,
      website: null,
      rating: 4.1
    };
  });

  return {
    success: true,
    markets,
    userLocation: {
      lat: userLat,
      lng: userLng,
      city: 'Sonipat',
      state: 'Haryana',
      country: 'India'
    },
    dataSource: 'Fallback provider data',
    searchRadius,
    timestamp: new Date().toISOString(),
    verification: {
      fallback: true,
      reason: 'Integrated market services unavailable'
    }
  };
};

// ==================== USER LOCATION-BASED NEARBY MARKETS API ====================
app.get('/api/market/nearby', async (req, res) => {
  console.log('🗺️ Nearby markets endpoint hit with user location:', req.query)
  try {
    const { lat, lng, radius = 50 } = req.query // radius in km, default 50km

    // Validate user location
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false,
        error: 'User location (lat, lng) is required',
        message: 'Please enable location access to find nearby markets'
      })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const searchRadius = parseFloat(radius)

    console.log(`🗺️ REAL USER LOCATION: Searching for markets within ${searchRadius}km of user at ${userLat}, ${userLng}`)

    // Use the integrated market service with user's actual location
    const result = await integratedMarketService.getVerifiedMarketsWithPrices(userLat, userLng, searchRadius)

    if (result.success) {
      console.log(`✅ Found ${result.markets.length} markets near user location`)
      
      return res.json({
        success: true,
        markets: result.markets,
        userLocation: result.userLocation,
        dataSource: result.dataSource,
        searchRadius: searchRadius,
        timestamp: result.timestamp,
        verification: result.verification
      })
    } else {
      throw new Error(result.error || 'Market discovery failed for user location')
    }

  } catch (error) {
    console.error('❌ Nearby markets API error for user location:', error)
    try {
      const { lat, lng, radius = 50 } = req.query
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      const searchRadius = parseFloat(radius)
      const fallbackResult = await buildFallbackNearbyMarkets(userLat, userLng, searchRadius)
      return res.json(fallbackResult)
    } catch (fallbackError) {
      console.error('❌ Fallback nearby markets failed:', fallbackError.message)
      return res.status(500).json({
        success: false,
        error: error.message,
        markets: [],
        message: 'Failed to find markets near your location',
        timestamp: new Date().toISOString()
      })
    }
  }
})

// Test endpoint for market provider
app.get('/api/test-provider', async (req, res) => {
  console.log('🧪 Testing market provider...')
  try {
    const provider = getProvider('agmarknet')
    console.log('🧪 Provider:', provider ? 'Found' : 'Not found')
    res.json({ success: true, provider: !!provider })
  } catch (error) {
    console.error('🧪 Provider test error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== INTEGRATED MARKET SERVICE TEST ENDPOINT ====================
app.get('/api/test-integrated-services', async (req, res) => {
  console.log('🧪 Testing integrated market services...')
  try {
    const results = await integratedMarketService.testIntegratedServices()
    res.json({
      success: true,
      message: 'Integrated market service test completed',
      results: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🧪 Integrated service test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Integrated market service test failed'
    })
  }
})

// ==================== MARKET-SPECIFIC PRICE API ====================
app.get('/api/markets/:marketId/prices', async (req, res) => {
  console.log('📊 Market-specific prices endpoint hit:', req.params.marketId)
  try {
    const { marketId } = req.params
    const { lat, lng } = req.query // User's location for context
    
    if (!marketId || marketId === 'undefined') {
      return res.status(400).json({ 
        error: 'Market ID is required',
        message: 'Please provide a valid market ID'
      })
    }

    // Get all markets near user to find the specific market
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'User location required',
        message: 'Please provide user coordinates (lat, lng) to fetch market prices'
      })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    // Fetch all markets near user
    const result = await integratedMarketService.getVerifiedMarketsWithPrices(userLat, userLng, 50)
    
    if (!result.success || !result.markets) {
      throw new Error('Failed to fetch market data')
    }

    // Find the specific market by ID
    const market = result.markets.find(m => m.id === marketId)
    
    if (!market) {
      return res.status(404).json({
        error: 'Market not found',
        message: `Market with ID ${marketId} not found near your location`
      })
    }

    console.log(`✅ Found market: ${market.name} at ${market.lat}, ${market.lng}`)

    // Fetch prices for this specific market's location
    const provider = getProvider('india')
    const marketPrices = await provider.fetchMarketData({
      city: market.name,
      district: market.district || market.city,
      state: market.state,
      lat: market.lat,
      lng: market.lng
    })

    // Enrich prices with market information
    const enrichedPrices = marketPrices.map(price => ({
      ...price,
      market_id: marketId,
      market_name: market.name,
      market_address: market.address || `${market.city}, ${market.state}`,
      market_lat: market.lat,
      market_lng: market.lng,
      market_type: market.marketType || 'Agricultural Market',
      data_source: 'AGMARKNET (Government of India)',
      last_updated: new Date().toISOString(),
      unit: 'Per Quintal (100 kg)',
      verification_status: market.verification_status || 'verified'
    }))

    console.log(`✅ Returning ${enrichedPrices.length} prices for market: ${market.name}`)

    res.json({
      success: true,
      market: {
        id: market.id,
        name: market.name,
        address: market.address || `${market.city}, ${market.state}`,
        city: market.city,
        state: market.state,
        lat: market.lat,
        lng: market.lng,
        distance: market.distance,
        marketType: market.marketType,
        verification_status: market.verification_status,
        has_live_prices: enrichedPrices.length > 0
      },
      prices: enrichedPrices,
      metadata: {
        total_crops: enrichedPrices.length,
        data_source: 'AGMARKNET (Government of India)',
        last_updated: new Date().toISOString(),
        unit: 'Prices in ₹ per Quintal (100 kg)',
        note: enrichedPrices.length === 0 ? 'No price data available for this market today' : 'Live government data for this specific market'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Market-specific prices error:', error)
    res.status(500).json({
      error: 'Failed to fetch market prices',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// ==================== MARKET COMPARISON API ====================
app.get('/api/market/compare', async (req, res) => {
  try {
    const { crop, location, city } = req.query
    const provider = getProvider('India'); // Default to India

    let result = []

    if (crop) {
      // Crop-First: Show this crop across all supported locations
      let allMarketsData = [];

      if (provider.getSupportedCities) {
        const cities = await provider.getSupportedCities();
        // Fetch data for all cities in parallel
        const promises = cities.map(c => provider.fetchMarketData({ city: c.city, state: c.state, lat: c.latitude, lng: c.longitude }));
        const results = await Promise.all(promises);
        allMarketsData = results.flat();
      } else {
        // Fallback if no list of cities
        allMarketsData = await provider.fetchMarketData({ city: 'India', lat: 20, lng: 78 });
      }

      const cropData = allMarketsData.filter(p => p.commodity.toLowerCase() === crop.toLowerCase())

      if (cropData.length > 0) {
        const avgPrice = cropData.reduce((sum, p) => sum + parseFloat(p.modal_price), 0) / cropData.length

        result = cropData.map(p => ({
          ...p,
          avg_price: avgPrice,
          variance: parseFloat(p.modal_price) - avgPrice,
          is_cheapest: parseFloat(p.modal_price) === Math.min(...cropData.map(cd => parseFloat(cd.modal_price))),
          is_highest: parseFloat(p.modal_price) === Math.max(...cropData.map(cd => parseFloat(cd.modal_price)))
        }))
      }
    } else if (location || city) {
      const targetLocation = location || city
      // Location-First: Show all crops in this location
      // We need to resolve lat/lng for the target location if not provided, but here we might just pass the name
      // provider.fetchMarketData handles name-based generation/fetching

      const locationData = await provider.fetchMarketData({ city: targetLocation, lat: 0, lng: 0 });

      // Calculate variance against a "National Average" (simulated or fetched)
      // For simplicity, we'll just return the data
      result = locationData.map(p => ({
        ...p,
        avg_price: p.modal_price, // Placeholder
        variance: 0
      }))
    } else {
      // No location provided - return error instead of defaulting to hardcoded location
      return res.status(400).json({ 
        error: 'Location required',
        message: 'Please provide crop, location, or city parameter to fetch market comparison data'
      })
    }

    res.json(result)
  } catch (error) {
    console.error('Market comparison error:', error)
    res.status(500).json({ error: 'Failed to fetch comparison data' })
  }
})



// Global error handling middleware - MUST return JSON
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)

  // Always return JSON, never HTML
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
})

// 404 handler - return JSON for all undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested path ${req.originalUrl} does not exist on this server.`,
    path: req.originalUrl
  })
})

// Bind immediately so Render can observe process health while database setup is
// completing. Optional providers and database readiness must never block listen.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`)
  initDB().catch((error) => {
    console.error('Unexpected database initialization failure:', error)
    databaseState.status = 'unavailable'
    databaseState.error = error.message
    databaseState.checkedAt = new Date().toISOString()
  })
})

server.on('error', (error) => {
  console.error('Server failed to bind:', error)
  process.exitCode = 1
})
// Export for Vercel serverless functions
module.exports = app
