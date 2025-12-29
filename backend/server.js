const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')
// Import auth routes factory
const createAuthRoutes = require('./routes/authRoutes')
require('dotenv').config()
const { getProvider } = require('./services/marketProviders');

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
let useLocalStorage = false
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
    // Try to connect to database
    await db.query('SELECT 1')
    console.log('✅ Database connected successfully')
    useLocalStorage = false
  } catch (err) {
    console.warn('⚠️ Database connection failed, falling back to in-memory storage for User/Farm data')
    console.warn('⚠️ Market data will still be fetched dynamically from providers')
    useLocalStorage = true
  }

  // Startup check for Google Config
  const googleId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (googleId) {
    console.log('✅ Google Auth: Client ID loaded (Starts with ' + googleId.substring(0, 10) + '...)');
  } else {
    console.log('ℹ️ Google Auth: Client ID not configured');
  }
}


async function createTables() {

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
      area DECIMAL(10,2) NOT NULL,
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
      user_id INT NOT NULL,
      farm_id INT,
      type VARCHAR(100) NOT NULL,
      details TEXT,
      quantity VARCHAR(100),
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (farm_id) REFERENCES farms(id)
    )`,
    `CREATE TABLE IF NOT EXISTS plant_diagnoses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      disease VARCHAR(255) NOT NULL,
      confidence INT NOT NULL,
      symptoms JSON,
      remedy TEXT,
      type VARCHAR(100),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS forum_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      tags JSON,
      likes INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS market_prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      commodity VARCHAR(255) NOT NULL,
      variety VARCHAR(255),
      market VARCHAR(255) NOT NULL,
      district VARCHAR(255) NOT NULL,
      state VARCHAR(255) NOT NULL,
      min_price DECIMAL(10,2) NOT NULL,
      max_price DECIMAL(10,2) NOT NULL,
      modal_price DECIMAL(10,2) NOT NULL,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      trend VARCHAR(20) DEFAULT 'stable',
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_state (state),
      INDEX idx_district (district),
      INDEX idx_market (market),
      INDEX idx_commodity (commodity),
      INDEX idx_date (date)
    )`
  ]

  for (const table of tables) {
    await db.execute(table)
  }

  console.log('✅ Database tables created successfully')
}

// Seed market data with Dec 2025 prices (only if table is empty)

// ==================== LOCATION API ====================
// ==================== LOCATION API ====================
app.get('/api/location/resolve', async (req, res) => {
  try {
    const { lat, lng } = req.query

    if (!lat || !lng) {
      return res.json({ locationRequired: true, message: 'Please select your city to view market data' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    // Use OpenWeatherMap for accurate reverse geocoding
    let city = 'Detected Location'
    let state = 'Unknown'
    let country = 'India'
    let source = 'gps'

    try {
      const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
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
      }
    } catch (geoError) {
      console.error('Reverse geocoding failed:', geoError.message)
      // Fallback: If geocoding fails, we still have valid coordinates!
      // Don't block the user. Just return the coordinates.
    }

    res.json({
      city,
      state,
      country,
      latitude,
      longitude,
      source
    })

  } catch (error) {
    console.error('Location resolution error:', error)
    res.status(500).json({ error: 'Internal server error during location resolution' })
  }
})

// Keep detect for backward compatibility but redirect to resolve logic
app.get('/api/location/detect', (req, res) => {
  res.redirect(`/api/location/resolve?lat=${req.query.lat}&lng=${req.query.lng}`)
})

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
  if (useLocalStorage) {
    return localData.users.find(u => u.email === email)
  }
  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
  return users[0]
}

const createUser = async (name, email, passwordHash) => {
  if (useLocalStorage) {
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
    return { insertId: newUser.id }
  }
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  )
  return result
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
  if (useLocalStorage) {
    return localData.farms.filter(f => f.user_id === userId)
  }
  const [farms] = await db.execute(
    'SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  )
  return farms
}

const createFarm = async (userId, farmData) => {
  const { name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location } = farmData
  const lat = location ? location.lat : null
  const lng = location ? location.lng : null

  if (useLocalStorage) {
    const newFarm = {
      id: localData.farms.length + 1,
      user_id: userId,
      name, crop, area, soil_type: soilType, planting_date: plantingDate,
      health_score: healthScore, days_to_harvest: daysToHarvest, progress,
      latitude: lat, longitude: lng,
      created_at: new Date()
    }
    localData.farms.push(newFarm)
    return { insertId: newFarm.id }
  }

  const [result] = await db.execute(
    'INSERT INTO farms (user_id, name, crop, area, soil_type, planting_date, health_score, days_to_harvest, progress, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, lat, lng]
  )
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

// Protected routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    if (useLocalStorage) {
      const user = localData.users.find(u => u.id === req.user.userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json(user)
    }
    const [users] = await db.execute(
      'SELECT id, name, email, city, state, country, latitude, longitude FROM users WHERE id = ?',
      [req.user.userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(users[0])
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get user profile' })
  }
})

app.put('/api/user/location', authenticateToken, async (req, res) => {
  try {
    const { city, state, country, latitude, longitude } = req.body

    if (useLocalStorage) {
      const user = localData.users.find(u => u.id === req.user.userId)
      if (user) {
        user.city = city
        user.state = state
        user.country = country || 'India'
        user.latitude = latitude
        user.longitude = longitude
      }
      return res.json({ success: true, message: 'Location updated successfully' })
    }

    await db.execute(
      'UPDATE users SET city = ?, state = ?, country = ?, latitude = ?, longitude = ? WHERE id = ?',
      [city, state, country || 'India', latitude, longitude, req.user.userId]
    )

    res.json({ success: true, message: 'Location updated successfully' })
  } catch (error) {
    console.error('Update location error:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

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
    const { name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location } = req.body

    if (!name || !crop || !area) {
      return res.status(400).json({ error: 'Name, crop, and area are required' })
    }

    const result = await createFarm(req.user.userId, {
      name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location
    })

    res.json({ success: true, farmId: result.insertId })
  } catch (error) {
    console.error('Create farm error:', error)
    res.status(500).json({ error: 'Failed to create farm' })
  }
})

app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const [activities] = await db.execute(
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
    const [posts] = await db.execute(`
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
    const [diagnoses] = await db.execute(
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
app.get('/api/market/nearby', async (req, res) => {
  try {
    let { lat, lng, city: providedCity } = req.query
    if (!lat || !lng) {
      return res.status(400).json({
        locationRequired: true,
        message: 'Location coordinates are required'
      })
    }

    lat = parseFloat(lat)
    lng = parseFloat(lng)

    // 1. Resolve Location (City/District)
    let city = providedCity || null
    let state = null
    let country = 'India' // Default to India for now

    try {
      const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse`, {
        params: {
          lat,
          lon: lng,
          limit: 1,
          appid: API_KEY
        },
        timeout: 5000
      }
      )
      if (response.data && response.data.length > 0) {
        city = response.data[0].name
        state = response.data[0].state
        country = response.data[0].country === 'IN' ? 'India' : response.data[0].country === 'US' ? 'USA' : 'Global'
      }
    } catch (e) {
      console.error('Geocoding failed:', e.message)
    }

    // Fallback if geocoding failed and no city provided
    if (!city) {
      city = 'Detected Location'
      state = 'Unknown'
    }

    // 2. Check Cache
    const cacheKey = `${city}-${country}`
    if (marketCache.has(cacheKey)) {
      const { timestamp, data } = marketCache.get(cacheKey)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log(`⚡ Serving cached market data for ${city}`)
        return res.json({
          resolvedLocation: { lat, lng, city, state, source: 'cache' },
          markets: data
        })
      }
    }

    // 3. Fetch from Provider
    const provider = getProvider(country)
    const marketData = await provider.fetchMarketData({ city, state, lat, lng })

    // 4. Update Cache
    marketCache.set(cacheKey, {
      timestamp: Date.now(),
      data: marketData
    })

    res.json({
      resolvedLocation: { lat, lng, city, state, source: 'live-api' },
      markets: marketData
    })

  } catch (error) {
    console.error('Nearby markets error:', error)
    res.status(500).json({ error: 'Failed to fetch market data' })
  }
})

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

    // Resolve City
    let city = 'Unknown'
    let country = 'India'
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          city = data[0].name
          country = data[0].country === 'IN' ? 'India' : 'Global'
        }
      }
    } catch (e) {
      console.error('Geocoding error:', e)
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

    // Resolve Country from City Name
    let country = 'India'
    let lat = 0, lng = 0
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          country = data[0].country === 'IN' ? 'India' : data[0].country === 'US' ? 'USA' : 'Global'
          lat = data[0].lat
          lng = data[0].lon
        }
      }
    } catch (e) {
      console.error('Geocoding error:', e)
    }

    const provider = getProvider(country)
    const marketData = await provider.fetchMarketData({ city: cityName, lat, lng })

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
      const trends = await provider.fetchTrends({ city, crop });
      return res.json(trends.map(t => ({
        commodity: crop,
        market: city,
        history: [t] // The frontend expects history array inside the object? No, wait.
        // The previous code returned [{ commodity, market, history: [...] }]
        // My provider returns [{ date, price }]
      })).map(t => ({
        ...t,
        history: trends // Wait, this mapping is wrong.
      })));

      // Let's fix the structure to match previous:
      // [{ commodity, market, history: [{ date, price }] }]

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

// Get all available cities for manual selection
app.get('/api/market/all-cities', async (req, res) => {
  try {
    const provider = getProvider('India'); // Default to India for list
    if (provider.getSupportedCities) {
      const cities = await provider.getSupportedCities();
      return res.json(cities);
    }

    // Fallback if provider doesn't support listing
    res.json([]);
  } catch (error) {
    console.error('Fetch all cities error:', error)
    res.status(500).json({ error: 'Failed to fetch cities list' })
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
    const [results] = await db.execute(query, [pattern, pattern, pattern])

    res.json(results)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})



// ==================== MARKET PRICES API ====================
app.get('/api/market-prices', async (req, res) => {
  try {
    const { state, district, market } = req.query

    let prices = []

    if (useLocalStorage) {
      // Use local storage data
      prices = localData.marketPrices.filter(item => {
        if (state && item.state !== state) return false
        if (district && item.district !== district) return false
        if (market && item.market !== market) return false
        return true
      })
    } else {
      // Use database
      let query = 'SELECT * FROM market_prices WHERE 1=1'
      const params = []

      if (state) {
        query += ' AND state = ?'
        params.push(state)
      }

      if (district) {
        query += ' AND district = ?'
        params.push(district)
      }

      if (market) {
        query += ' AND market = ?'
        params.push(market)
      }

      query += ' ORDER BY date DESC, commodity ASC'

      const [dbPrices] = await db.execute(query, params)
      prices = dbPrices
    }

    // Transform data to match frontend format
    const formattedPrices = prices.map(item => ({
      id: `${item.market.toLowerCase()}-${item.commodity.toLowerCase()}-${item.id}`,
      commodity: item.commodity,
      variety: item.variety,
      market: item.market,
      district: item.district,
      state: item.state,
      min_price: parseFloat(item.min_price),
      max_price: parseFloat(item.max_price),
      modal_price: parseFloat(item.modal_price),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lng),
      trend: item.trend,
      date: item.date || new Date().toISOString().split('T')[0]
    }))

    console.log(`📊 Returning ${formattedPrices.length} market price records`)
    res.json(formattedPrices)
  } catch (error) {
    console.error('Fetch market prices error:', error)
    res.status(500).json({ error: 'Failed to fetch market prices' })
  }
})

// ==================== MARKET COMPARISON API ====================
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
      // Default: Show top crops from a major hub (e.g., Delhi/Mumbai or random)
      const defaultData = await provider.fetchMarketData({ city: 'New Delhi', lat: 28.61, lng: 77.20 });
      result = defaultData.sort((a, b) => b.modal_price - a.modal_price).slice(0, 10);
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
