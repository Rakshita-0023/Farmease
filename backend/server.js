const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001

// Database connection
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: { rejectUnauthorized: false }
}

let db

// Initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig)
    console.log('Connected to TiDB Cloud database')
    
    // Create tables if they don't exist
    await createTables()
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
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
      progress INT DEFAULT 0,
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
  console.log('Database tables initialized')
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
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    )
    
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
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const user = users[0]
    
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

// Protected routes
app.get('/api/farms', authenticateToken, async (req, res) => {
  try {
    const [farms] = await db.execute(
      'SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    )
    res.json(farms)
  } catch (error) {
    console.error('Fetch farms error:', error)
    res.status(500).json({ error: 'Failed to fetch farms' })
  }
})

app.post('/api/farms', authenticateToken, async (req, res) => {
  try {
    const { name, crop, area, soilType } = req.body
    
    if (!name || !crop || !area) {
      return res.status(400).json({ error: 'Name, crop, and area are required' })
    }
    
    const [result] = await db.execute(
      'INSERT INTO farms (user_id, name, crop, area, soil_type) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, name, crop, area, soilType]
    )
    
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