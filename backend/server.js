const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const db = require('./db')
// Import auth routes factory
const createAuthRoutes = require('./routes/authRoutes')
const locationRoutes = require('./routes/locationRoutes')
const createUserRoutes = require('./routes/userRoutes')
const createWeatherRoutes = require('./routes/weatherRoutes')
require('dotenv').config()

// INTEGRATED MARKET SERVICE WITH REGISTRY
const IntegratedMarketService = require('./services/marketRegistry/integratedMarketService')
const integratedMarketService = new IntegratedMarketService()

// Legacy provider for fallback
const { getProvider } = require('./services/marketProviders/index');

const app = express()
const PORT = process.env.PORT || 5001

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
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    
    // In production, do NOT fall back to in-memory - fail loudly
    if (process.env.DATABASE_URL) {
      console.error('🚨 CRITICAL: Database connection failed in production!')
      console.error('🚨 Check DATABASE_URL and database server status')
      // Still allow server to start but log the error
    }
    
    console.warn('⚠️ Using in-memory storage (data will not persist)')
    storageState.useLocalStorage = true
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

// Middleware - CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://farmeaseai-kappa.vercel.app',
    'https://farmeaseai.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))

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

  console.log('🔐 Auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing')
  console.log('🔐 Auth middleware - Token:', token ? 'Present' : 'Missing')

  if (!token) {
    console.log('❌ Auth middleware - No token provided')
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Auth middleware - Token verification failed:', err.message)
      return res.status(403).json({ error: 'Invalid token' })
    }
    
    // CRITICAL: Check if userId is valid
    if (!user || !user.userId) {
      console.log('❌ Auth middleware - Token has no valid userId:', user)
      return res.status(401).json({ error: 'Invalid token - please log in again' })
    }
    
    console.log('✅ Auth middleware - Token verified for user:', user.userId)
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
      const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'
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
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
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
      const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'
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
        const fallbackRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`)
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
    return res.status(500).json({
      success: false,
      error: error.message,
      markets: [],
      message: 'Failed to find markets near your location',
      timestamp: new Date().toISOString()
    })
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

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
// Export for Vercel serverless functions
module.exports = app
