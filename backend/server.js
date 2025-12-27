const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { getDb } = require('./dbConnect')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001

let db
let useLocalStorage = false

// Simple in-memory storage for fallback
const localData = {
  users: [],
  farms: [],
  activities: [],
  diagnoses: [],
  posts: []
}

// Initialize database connection
async function initDB() {
  db = await getDb()

  if (!db) {
    console.log('⚠️ Using in-memory storage (Local Fallback)')
    useLocalStorage = true
  } else {
    await createTables()
  }
}

async function createTables() {
  if (useLocalStorage) return

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
    )`
  ]

  for (const table of tables) {
    await db.execute(table)
  }
  console.log('✅ Database tables initialized')
  await migrateTables()
}

async function migrateTables() {
  try {
    // Check and add missing columns for 'farms' table
    const [columns] = await db.execute('SHOW COLUMNS FROM farms')
    const existingColumns = columns.map(col => col.Field)

    const newColumns = [
      { name: 'soil_type', type: 'VARCHAR(100)' },
      { name: 'planting_date', type: 'DATE' },
      { name: 'health_score', type: 'INT DEFAULT 100' },
      { name: 'days_to_harvest', type: 'INT' },
      { name: 'progress', type: 'INT DEFAULT 0' },
      { name: 'latitude', type: 'DECIMAL(10, 8)' },
      { name: 'longitude', type: 'DECIMAL(11, 8)' }
    ]

    for (const col of newColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding missing column ${col.name} to farms table...`)
        await db.execute(`ALTER TABLE farms ADD COLUMN ${col.name} ${col.type}`)
      }
    }
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Helper functions for local storage fallback
const getNextId = (collection) => {
  return Math.max(0, ...localData[collection].map(item => item.id || 0)) + 1
}

const findUser = async (email) => {
  if (useLocalStorage) {
    return localData.users.find(user => user.email === email)
  } else {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    return users[0]
  }
}

const createUser = async (name, email, passwordHash) => {
  if (useLocalStorage) {
    const user = {
      id: getNextId('users'),
      name,
      email,
      password_hash: passwordHash,
      created_at: new Date()
    }
    localData.users.push(user)
    return { insertId: user.id }
  } else {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    )
    return result
  }
}

const getUserFarms = async (userId) => {
  if (useLocalStorage) {
    return localData.farms.filter(farm => farm.user_id === userId)
  } else {
    const [farms] = await db.execute(
      'SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return farms
  }
}

const createFarm = async (userId, farmData) => {
  if (useLocalStorage) {
    const farm = {
      id: getNextId('farms'),
      user_id: userId,
      ...farmData,
      created_at: new Date()
    }
    localData.farms.push(farm)
    return { insertId: farm.id }
  } else {
    const { name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, location } = farmData
    const lat = location ? location.lat : null
    const lng = location ? location.lng : null

    const [result] = await db.execute(
      'INSERT INTO farms (user_id, name, crop, area, soil_type, planting_date, health_score, days_to_harvest, progress, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, crop, area, soilType, plantingDate, healthScore, daysToHarvest, progress, lat, lng]
    )
    return result
  }
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173',
  credentials: true
}))
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

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
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
      process.env.SECRET_KEY,
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
      process.env.SECRET_KEY,
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

app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, googleId, photoUrl } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Check if user exists
    let user = await findUser(email)

    if (!user) {
      // Create new user (password is random/dummy for google users)
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      const passwordHash = await bcrypt.hash(dummyPassword, 10)

      const result = await createUser(name || email.split('@')[0], email, passwordHash)
      user = { id: result.insertId, name: name || email.split('@')[0], email }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, photoUrl }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(500).json({ error: 'Google authentication failed' })
  }
})

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
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