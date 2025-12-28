const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001

// Initialize database connection
async function initDB() {
  try {
    // Test database connection
    await db.query('SELECT 1')
    console.log('✅ Railway MySQL connected successfully')
    
    // Create tables and seed data
    await createTables()
    await seedMarketData()
    
    // Startup check for Google Config
    const googleId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (googleId) {
      console.log('✅ Google Auth: Client ID loaded (Starts with ' + googleId.substring(0, 10) + '...)');
    } else {
      console.error('❌ Google Auth: Client ID NOT FOUND in environment variables!');
    }
    
    // Check SECRET_KEY
    const secretKey = process.env.SECRET_KEY;
    if (secretKey) {
      console.log('✅ JWT Secret Key loaded');
    } else {
      console.error('❌ SECRET_KEY NOT FOUND in environment variables!');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1) // Fail loudly instead of silent fallback
  }
}

async function createTables() {

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
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
async function seedMarketData() {
  try {
    // Check if data already exists
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM market_prices')
    if (rows[0].count > 0) {
      console.log('✅ Market data already exists, skipping seed')
      return
    }

    console.log('📊 Seeding fresh market data...')

    const marketData = [
      // GUNTUR (3 crops)
      { commodity: 'Red Chilli', variety: 'Teja', market: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', min_price: 17464, max_price: 20060, modal_price: 18500, lat: 16.3067, lng: 80.4365, trend: 'up', date: '2025-12-27' },
      { commodity: 'Turmeric', variety: 'Finger', market: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', min_price: 6800, max_price: 7500, modal_price: 7200, lat: 16.3067, lng: 80.4365, trend: 'down', date: '2025-12-27' },
      { commodity: 'Cotton', variety: 'Bunny', market: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', min_price: 6500, max_price: 7100, modal_price: 6850, lat: 16.3067, lng: 80.4365, trend: 'up', date: '2025-12-27' },

      // VIJAYAWADA (4 crops)
      { commodity: 'Maize', variety: 'Hybrid', market: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', min_price: 1750, max_price: 1900, modal_price: 1809, lat: 16.5062, lng: 80.6480, trend: 'down', date: '2025-12-27' },
      { commodity: 'Brinjal', variety: 'Local', market: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', min_price: 1600, max_price: 2000, modal_price: 1800, lat: 16.5062, lng: 80.6480, trend: 'up', date: '2025-12-27' },
      { commodity: 'Banana', variety: 'Robusta', market: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', min_price: 1200, max_price: 1600, modal_price: 1450, lat: 16.5062, lng: 80.6480, trend: 'up', date: '2025-12-27' },
      { commodity: 'Rice', variety: 'Sona Masuri', market: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', min_price: 3200, max_price: 4500, modal_price: 3800, lat: 16.5062, lng: 80.6480, trend: 'up', date: '2025-12-27' },

      // HYDERABAD (6 crops)
      { commodity: 'Pomegranate', variety: 'Bhagwa', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 10000, max_price: 14000, modal_price: 12500, lat: 17.3850, lng: 78.4867, trend: 'up', date: '2025-12-27' },
      { commodity: 'Papaya', variety: 'Taiwan', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 1200, max_price: 1800, modal_price: 1500, lat: 17.3850, lng: 78.4867, trend: 'down', date: '2025-12-27' },
      { commodity: 'Onion', variety: 'Red', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 2500, max_price: 3500, modal_price: 3000, lat: 17.3850, lng: 78.4867, trend: 'up', date: '2025-12-27' },
      { commodity: 'Tomato', variety: 'Hybrid', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 1800, max_price: 2400, modal_price: 2100, lat: 17.3850, lng: 78.4867, trend: 'down', date: '2025-12-27' },
      { commodity: 'Wheat', variety: 'Lokwan', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 2400, max_price: 2700, modal_price: 2520, lat: 17.3850, lng: 78.4867, trend: 'up', date: '2025-12-27' },
      { commodity: 'Jowar', variety: 'Hybrid', market: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', min_price: 2100, max_price: 2350, modal_price: 2220, lat: 17.3850, lng: 78.4867, trend: 'up', date: '2025-12-27' },

      // WARANGAL (4 crops)
      { commodity: 'Cotton', variety: 'Long Staple', market: 'Warangal', district: 'Warangal', state: 'Telangana', min_price: 6800, max_price: 7200, modal_price: 7000, lat: 17.9689, lng: 79.5941, trend: 'up', date: '2025-12-27' },
      { commodity: 'Paddy', variety: 'Common', market: 'Warangal', district: 'Warangal', state: 'Telangana', min_price: 2100, max_price: 2300, modal_price: 2203, lat: 17.9689, lng: 79.5941, trend: 'up', date: '2025-12-27' },
      { commodity: 'Groundnut', variety: 'Pods', market: 'Warangal', district: 'Warangal', state: 'Telangana', min_price: 5500, max_price: 6200, modal_price: 5900, lat: 17.9689, lng: 79.5941, trend: 'up', date: '2025-12-27' },
      { commodity: 'Wheat', variety: 'Durum', market: 'Warangal', district: 'Warangal', state: 'Telangana', min_price: 2450, max_price: 2650, modal_price: 2550, lat: 17.9689, lng: 79.5941, trend: 'up', date: '2025-12-27' },

      // NIZAMABAD (3 crops)
      { commodity: 'Turmeric', variety: 'Bulb', market: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', min_price: 6500, max_price: 7200, modal_price: 6900, lat: 18.6725, lng: 78.0941, trend: 'up', date: '2025-12-27' },
      { commodity: 'Soybean', variety: 'Yellow', market: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', min_price: 4200, max_price: 4600, modal_price: 4450, lat: 18.6725, lng: 78.0941, trend: 'down', date: '2025-12-27' },
      { commodity: 'Jowar', variety: 'White', market: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', min_price: 2150, max_price: 2300, modal_price: 2230, lat: 18.6725, lng: 78.0941, trend: 'up', date: '2025-12-27' },

      // KURNOOL (2 crops)
      { commodity: 'Onion', variety: 'Bellary', market: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', min_price: 2200, max_price: 3000, modal_price: 2600, lat: 15.8281, lng: 78.0373, trend: 'up', date: '2025-12-27' },
      { commodity: 'Sunflower', variety: 'Seed', market: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', min_price: 5800, max_price: 6400, modal_price: 6100, lat: 15.8281, lng: 78.0373, trend: 'up', date: '2025-12-27' },

      // KHAMMAM (1 crop)
      { commodity: 'Red Chilli', variety: '334', market: 'Khammam', district: 'Khammam', state: 'Telangana', min_price: 16500, max_price: 19000, modal_price: 17800, lat: 17.2473, lng: 80.1514, trend: 'up', date: '2025-12-27' },

      // ADILABAD (2 crops)
      { commodity: 'Cotton', variety: 'Hybrid', market: 'Adilabad', district: 'Adilabad', state: 'Telangana', min_price: 6600, max_price: 7000, modal_price: 6800, lat: 19.6632, lng: 78.5314, trend: 'up', date: '2025-12-27' },
      { commodity: 'Soybean', variety: 'Black', market: 'Adilabad', district: 'Adilabad', state: 'Telangana', min_price: 4100, max_price: 4500, modal_price: 4300, lat: 19.6632, lng: 78.5314, trend: 'stable', date: '2025-12-27' }
    ]

    const insertQuery = `INSERT INTO market_prices 
      (commodity, variety, market, district, state, min_price, max_price, modal_price, latitude, longitude, trend, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    for (const item of marketData) {
      await db.execute(insertQuery, [
        item.commodity, item.variety, item.market, item.district, item.state,
        item.min_price, item.max_price, item.modal_price,
        item.lat, item.lng, item.trend, item.date
      ])
    }

    console.log(`✅ Seeded ${marketData.length} unique market price records`)
  } catch (error) {
    console.error('❌ Error seeding market data:', error)
  }
}

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
  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
  return users[0]
}

const createUser = async (name, email, passwordHash) => {
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  )
  return result
}

const getUserFarms = async (userId) => {
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

  const [result] = await db.execute(
    'INSERT INTO farms (user_id, name, crop, area, soil_type, planting_date, health_score, days_to_harvest, progress, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, lat, lng]
  )
  return result
}

// Middleware - Temporary debug CORS (allows all origins)
app.use(cors())
app.use(express.json({ limit: '10mb' }))

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

  jwt.verify(token, process.env.SECRET_KEY || 'farmease-fallback-secret-2024', (err, user) => {
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

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user exists
    const existing = await findUser(email)
    if (existing) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await createUser(name, email, passwordHash)

    // Generate token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.SECRET_KEY || 'farmease-fallback-secret-2024',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: result.insertId, name, email }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await findUser(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SECRET_KEY || 'farmease-fallback-secret-2024',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

const { OAuth2Client } = require('google-auth-library');

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Detailed validation
    if (!token) {
      console.error('❌ Google Auth: No token provided');
      return res.status(400).json({
        success: false,
        error: 'Token is required',
        details: 'No Google ID token found in request body'
      });
    }

    // Get Google Client ID from environment (check multiple possible names)
    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    console.log('🔍 Debug: Checking Google Config...');
    console.log('   - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found (Starts with ' + process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'Not Found');
    console.log('   - VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? 'Found (Starts with ' + process.env.VITE_GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'Not Found');

    if (!googleClientId) {
      console.error('❌ Google Auth: Google Client ID not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        details: 'Google Client ID not configured on server. Ensure GOOGLE_CLIENT_ID is set in your environment variables or .env file.'
      });
    }

    console.log('🔐 Verifying Google token...');
    console.log('📋 Using Client ID:', googleClientId.substring(0, 20) + '...');

    // Initialize OAuth2Client with the correct client ID
    const client = new OAuth2Client(googleClientId);

    // Verify the ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token',
        details: verifyError.message
      });
    }

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture: photoUrl } = payload;

    if (!email) {
      console.error('❌ No email in Google token payload');
      return res.status(400).json({
        success: false,
        error: 'Email not found',
        details: 'Google account does not have an email address'
      });
    }

    console.log('✅ Token verified for:', email);

    // Check if user exists
    let user = await findUser(email);

    if (!user) {
      console.log('📝 Creating new user for:', email);
      // Create new user (password is random/dummy for google users)
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(dummyPassword, 10);

      const result = await createUser(name || email.split('@')[0], email, passwordHash);
      user = { id: result.insertId, name: name || email.split('@')[0], email };
      console.log('✅ New user created with ID:', user.id);
    } else {
      console.log('✅ Existing user found:', user.id);
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SECRET_KEY || 'farmease-fallback-secret-2024',
      { expiresIn: '7d' }
    );

    console.log('✅ Google authentication successful for:', email);

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user.id,
        name: user.name || name,
        email: user.email,
        photoUrl
      }
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed',
      details: error.message,
      type: error.name
    });
  }
});

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

// ==================== MARKET PRICES API ====================
app.get('/api/market-prices', async (req, res) => {
  try {
    const { state, district, market } = req.query

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

    const [prices] = await db.execute(query, params)

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
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
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
app.get('/api/market/compare', async (req, res) => {
  try {
    const { crop, location } = req.query
    
    const [prices] = await db.execute('SELECT * FROM market_prices')
    let result = []

    if (crop) {
      // Crop-First: Show this crop across all locations
      const cropData = prices.filter(p => p.commodity.toLowerCase() === crop.toLowerCase())

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
    } else if (location) {
      // Location-First: Show all crops in this location (Market, District, or State)
      const locationData = prices.filter(p =>
        p.market.toLowerCase().includes(location.toLowerCase()) ||
        p.district.toLowerCase() === location.toLowerCase() ||
        p.state.toLowerCase() === location.toLowerCase()
      )

      // Calculate variance against state average for each crop
      result = locationData.map(p => {
        const sameCropAllLocations = prices.filter(allP => allP.commodity === p.commodity)
        const stateAvg = sameCropAllLocations.reduce((sum, allP) => sum + parseFloat(allP.modal_price), 0) / sameCropAllLocations.length

        return {
          ...p,
          avg_price: stateAvg,
          variance: parseFloat(p.modal_price) - stateAvg
        }
      })
    } else {
      // Default: Top 10 Trending
      result = prices
        .filter(p => p.trend === 'up')
        .sort((a, b) => b.modal_price - a.modal_price)
        .slice(0, 10)
    }

    // Standardize format
    const formatted = result.map(item => ({
      id: item.id,
      commodity: item.commodity,
      variety: item.variety,
      market: item.market,
      state: item.state,
      district: item.district,
      min_price: parseFloat(item.min_price),
      max_price: parseFloat(item.max_price),
      modal_price: parseFloat(item.modal_price),
      avg_price: item.avg_price ? parseFloat(item.avg_price) : null,
      variance: item.variance ? parseFloat(item.variance) : null,
      is_cheapest: item.is_cheapest || false,
      is_highest: item.is_highest || false,
      trend: item.trend,
      lat: item.latitude,
      lng: item.longitude,
      date: item.date || new Date().toISOString().split('T')[0]
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Market comparison error:', error)
    res.status(500).json({ error: 'Failed to fetch comparison data' })
  }
})



// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ error: 'Internal server error' })
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
