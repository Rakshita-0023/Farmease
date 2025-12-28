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
  posts: [],
  marketPrices: []
}

// Initialize database connection
async function initDB() {
  // Force local storage for testing
  console.log('⚠️ Using in-memory storage (Local Fallback) for testing')
  useLocalStorage = true
  seedMarketDataLocal() // Seed market data for local storage
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

  // Seed market data if table is empty
  await seedMarketData()
  await migrateTables()
}

// Seed market data with Dec 2025 prices
async function seedMarketData() {
  if (useLocalStorage) return

  try {
    // ALWAYS clear existing data to prevent duplicates
    console.log('🧹 Clearing existing market data...')
    await db.execute('DELETE FROM market_prices')

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

// Market data seeding function - COMPREHENSIVE CROP LIST
const seedMarketDataLocal = () => {
  if (useLocalStorage && localData.marketPrices.length === 0) {
    const marketPrices = [
      // ========== HYDERABAD MARKETS (Telangana) ==========
      // Bowenpally Market Yard (North Hyderabad)
      { id: 1, commodity: 'Wheat', variety: 'HD-2967', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 2400, max_price: 2650, modal_price: 2550, trend: 'up', lat: 17.4750, lng: 78.4767 },
      { id: 2, commodity: 'Jowar', variety: 'CSH-16', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 2100, max_price: 2350, modal_price: 2220, trend: 'up', lat: 17.4750, lng: 78.4767 },
      { id: 3, commodity: 'Rice', variety: 'Basmati-1121', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 3500, max_price: 4200, modal_price: 3800, trend: 'stable', lat: 17.4750, lng: 78.4767 },
      { id: 4, commodity: 'Maize', variety: 'Hybrid', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 1750, max_price: 1950, modal_price: 1850, trend: 'down', lat: 17.4750, lng: 78.4767 },
      { id: 5, commodity: 'Onion', variety: 'Nashik Red', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 2500, max_price: 3500, modal_price: 3000, trend: 'up', lat: 17.4750, lng: 78.4767 },

      // Gudimalkapur Market (Central-West Hyderabad)
      { id: 6, commodity: 'Tomato', variety: 'Hybrid', market: 'Gudimalkapur Market', state: 'Telangana', district: 'Hyderabad', min_price: 1800, max_price: 2400, modal_price: 2100, trend: 'down', lat: 17.3850, lng: 78.4467 },
      { id: 7, commodity: 'Potato', variety: 'Kufri Jyoti', market: 'Gudimalkapur Market', state: 'Telangana', district: 'Hyderabad', min_price: 1200, max_price: 1600, modal_price: 1400, trend: 'stable', lat: 17.3850, lng: 78.4467 },
      { id: 8, commodity: 'Banana', variety: 'Robusta', market: 'Gudimalkapur Market', state: 'Telangana', district: 'Hyderabad', min_price: 1200, max_price: 1800, modal_price: 1500, trend: 'stable', lat: 17.3850, lng: 78.4467 },
      { id: 9, commodity: 'Mango', variety: 'Alphonso', market: 'Gudimalkapur Market', state: 'Telangana', district: 'Hyderabad', min_price: 4000, max_price: 6000, modal_price: 5000, trend: 'up', lat: 17.3850, lng: 78.4467 },

      // Mehdipatnam Rythu Bazar (Central Hyderabad)
      { id: 10, commodity: 'Cabbage', variety: 'Green', market: 'Mehdipatnam Rythu Bazar', state: 'Telangana', district: 'Hyderabad', min_price: 800, max_price: 1200, modal_price: 1000, trend: 'stable', lat: 17.3950, lng: 78.4567 },
      { id: 11, commodity: 'Cauliflower', variety: 'Snowball', market: 'Mehdipatnam Rythu Bazar', state: 'Telangana', district: 'Hyderabad', min_price: 1500, max_price: 2000, modal_price: 1750, trend: 'up', lat: 17.3950, lng: 78.4567 },
      { id: 12, commodity: 'Chana Dal', variety: 'Desi', market: 'Mehdipatnam Rythu Bazar', state: 'Telangana', district: 'Hyderabad', min_price: 5500, max_price: 6500, modal_price: 6000, trend: 'up', lat: 17.3950, lng: 78.4567 },

      // L.B. Nagar Market (East Hyderabad)
      { id: 13, commodity: 'Cotton', variety: 'Bt Cotton', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 5800, max_price: 6200, modal_price: 6000, trend: 'up', lat: 17.3450, lng: 78.5567 },
      { id: 14, commodity: 'Groundnut', variety: 'TMV-2', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 5200, max_price: 5800, modal_price: 5500, trend: 'stable', lat: 17.3450, lng: 78.5567 },
      { id: 15, commodity: 'Sunflower', variety: 'Hybrid', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 5800, max_price: 6400, modal_price: 6100, trend: 'up', lat: 17.3450, lng: 78.5567 },

      // ========== VIJAYAWADA MARKETS (Andhra Pradesh) ==========
      // Gollapudi Market Yard (West Vijayawada)
      { id: 16, commodity: 'Wheat', variety: 'PBW-343', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 2350, max_price: 2600, modal_price: 2475, trend: 'up', lat: 16.5462, lng: 80.5980 },
      { id: 17, commodity: 'Rice', variety: 'Sona Masuri', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 3200, max_price: 4500, modal_price: 3850, trend: 'up', lat: 16.5462, lng: 80.5980 },
      { id: 18, commodity: 'Maize', variety: 'Hybrid', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 1750, max_price: 1900, modal_price: 1850, trend: 'down', lat: 16.5462, lng: 80.5980 },
      { id: 19, commodity: 'Onion', variety: 'Red', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 2200, max_price: 3000, modal_price: 2600, trend: 'up', lat: 16.5462, lng: 80.5980 },

      // Patamata Rythu Bazar (East Vijayawada)
      { id: 20, commodity: 'Tomato', variety: 'Hybrid', market: 'Patamata Rythu Bazar', state: 'Andhra Pradesh', district: 'Krishna', min_price: 2000, max_price: 3000, modal_price: 2500, trend: 'up', lat: 16.4962, lng: 80.6780 },
      { id: 21, commodity: 'Potato', variety: 'Local', market: 'Patamata Rythu Bazar', state: 'Andhra Pradesh', district: 'Krishna', min_price: 1100, max_price: 1500, modal_price: 1300, trend: 'stable', lat: 16.4962, lng: 80.6780 },
      { id: 22, commodity: 'Banana', variety: 'Robusta', market: 'Patamata Rythu Bazar', state: 'Andhra Pradesh', district: 'Krishna', min_price: 1200, max_price: 1600, modal_price: 1450, trend: 'up', lat: 16.4962, lng: 80.6780 },

      // Singh Nagar Market (North Vijayawada)
      { id: 23, commodity: 'Mango', variety: 'Banganapalli', market: 'Singh Nagar Market', state: 'Andhra Pradesh', district: 'Krishna', min_price: 3500, max_price: 5000, modal_price: 4250, trend: 'stable', lat: 16.5362, lng: 80.6380 },
      { id: 24, commodity: 'Orange', variety: 'Nagpur', market: 'Singh Nagar Market', state: 'Andhra Pradesh', district: 'Krishna', min_price: 3000, max_price: 4000, modal_price: 3500, trend: 'stable', lat: 16.5362, lng: 80.6380 },
      { id: 25, commodity: 'Cabbage', variety: 'Green', market: 'Singh Nagar Market', state: 'Andhra Pradesh', district: 'Krishna', min_price: 900, max_price: 1300, modal_price: 1100, trend: 'stable', lat: 16.5362, lng: 80.6380 },

      // ========== GUNTUR MARKETS (Andhra Pradesh) ==========
      { id: 26, commodity: 'Chilli', variety: 'Teja', market: 'Guntur Chilli Yard', state: 'Andhra Pradesh', district: 'Guntur', min_price: 17464, max_price: 20060, modal_price: 18200, trend: 'up', lat: 16.3067, lng: 80.4365 },
      { id: 27, commodity: 'Turmeric', variety: 'Finger', market: 'Guntur Chilli Yard', state: 'Andhra Pradesh', district: 'Guntur', min_price: 6800, max_price: 7500, modal_price: 7200, trend: 'down', lat: 16.3067, lng: 80.4365 },
      { id: 28, commodity: 'Cotton', variety: 'Bunny', market: 'Guntur Market Yard', state: 'Andhra Pradesh', district: 'Guntur', min_price: 6500, max_price: 7100, modal_price: 6850, trend: 'up', lat: 16.3167, lng: 80.4465 },
      { id: 29, commodity: 'Groundnut', variety: 'TMV-2', market: 'Guntur Market Yard', state: 'Andhra Pradesh', district: 'Guntur', min_price: 5200, max_price: 5800, modal_price: 5500, trend: 'up', lat: 16.3167, lng: 80.4465 },

      // ========== WARANGAL MARKETS (Telangana) ==========
      { id: 30, commodity: 'Cotton', variety: 'Long Staple', market: 'Enumamula Market Yard', state: 'Telangana', district: 'Warangal', min_price: 6800, max_price: 7200, modal_price: 7000, trend: 'up', lat: 17.9889, lng: 79.6141 },
      { id: 31, commodity: 'Paddy', variety: 'Common', market: 'Enumamula Market Yard', state: 'Telangana', district: 'Warangal', min_price: 2100, max_price: 2300, modal_price: 2203, trend: 'up', lat: 17.9889, lng: 79.6141 },
      { id: 32, commodity: 'Groundnut', variety: 'Pods', market: 'Warangal City Market', state: 'Telangana', district: 'Warangal', min_price: 5500, max_price: 6200, modal_price: 5900, trend: 'up', lat: 17.9689, lng: 79.5941 },

      // ========== NIZAMABAD MARKETS (Telangana) ==========
      { id: 33, commodity: 'Turmeric', variety: 'Bulb', market: 'Nizamabad Market Yard', state: 'Telangana', district: 'Nizamabad', min_price: 6500, max_price: 7200, modal_price: 6900, trend: 'up', lat: 18.6825, lng: 78.1041 },
      { id: 34, commodity: 'Jowar', variety: 'White', market: 'Nizamabad Market Yard', state: 'Telangana', district: 'Nizamabad', min_price: 2150, max_price: 2300, modal_price: 2230, trend: 'up', lat: 18.6825, lng: 78.1041 },

      // ========== KURNOOL MARKETS (Andhra Pradesh) ==========
      { id: 35, commodity: 'Onion', variety: 'Bellary', market: 'Kurnool Market Yard', state: 'Andhra Pradesh', district: 'Kurnool', min_price: 2200, max_price: 3000, modal_price: 2600, trend: 'up', lat: 15.8381, lng: 78.0473 },

      // ========== ADDITIONAL DATA FOR VARIETY ==========
      { id: 36, commodity: 'Arhar Dal', variety: 'Tur', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 6000, max_price: 7000, modal_price: 6500, trend: 'stable', lat: 17.4750, lng: 78.4767 },
      { id: 37, commodity: 'Mustard', variety: 'Yellow', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 5000, max_price: 6000, modal_price: 5500, trend: 'stable', lat: 17.4750, lng: 78.4767 },
      { id: 38, commodity: 'Apple', variety: 'Shimla', market: 'Gudimalkapur Market', state: 'Telangana', district: 'Hyderabad', min_price: 8000, max_price: 12000, modal_price: 10000, trend: 'stable', lat: 17.3850, lng: 78.4467 },
      { id: 39, commodity: 'Coffee', variety: 'Arabica', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 15000, max_price: 20000, modal_price: 17500, trend: 'up', lat: 17.3450, lng: 78.5567 },
      { id: 40, commodity: 'Tea', variety: 'CTC', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 12000, max_price: 16000, modal_price: 14000, trend: 'stable', lat: 17.3450, lng: 78.5567 },
      { id: 41, commodity: 'Ragi', variety: 'Finger Millet', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 2500, max_price: 3000, modal_price: 2750, trend: 'stable', lat: 16.5462, lng: 80.5980 },
      { id: 42, commodity: 'Rubber', variety: 'Natural', market: 'L.B. Nagar Market', state: 'Telangana', district: 'Hyderabad', min_price: 18000, max_price: 22000, modal_price: 20000, trend: 'up', lat: 17.3450, lng: 78.5567 },
      { id: 43, commodity: 'Bajra', variety: 'HHB-67', market: 'Bowenpally Market Yard', state: 'Telangana', district: 'Hyderabad', min_price: 1900, max_price: 2100, modal_price: 2000, trend: 'stable', lat: 17.4750, lng: 78.4767 },
      { id: 44, commodity: 'Moong Dal', variety: 'Green', market: 'Mehdipatnam Rythu Bazar', state: 'Telangana', district: 'Hyderabad', min_price: 7000, max_price: 8000, modal_price: 7500, trend: 'stable', lat: 17.3950, lng: 78.4567 },
      { id: 45, commodity: 'Jowar', variety: 'White', market: 'Nizamabad Market Yard', state: 'Telangana', district: 'Nizamabad', min_price: 2150, max_price: 2300, modal_price: 2230, trend: 'up', lat: 18.6825, lng: 78.1041 },
      { id: 46, commodity: 'Rice', variety: 'PR-126', market: 'Nizamabad Market Yard', state: 'Telangana', district: 'Nizamabad', min_price: 3300, max_price: 3800, modal_price: 3550, trend: 'stable', lat: 18.6825, lng: 78.1041 },
      { id: 47, commodity: 'Sunflower', variety: 'Seed', market: 'Kurnool Market Yard', state: 'Andhra Pradesh', district: 'Kurnool', min_price: 5800, max_price: 6400, modal_price: 6100, trend: 'up', lat: 15.8381, lng: 78.0473 },
      { id: 48, commodity: 'Banana', variety: 'Robusta', market: 'Kurnool Market Yard', state: 'Andhra Pradesh', district: 'Kurnool', min_price: 1200, max_price: 1800, modal_price: 1500, trend: 'down', lat: 15.8381, lng: 78.0473 },
      { id: 49, commodity: 'Jute', variety: 'Tossa', market: 'Enumamula Market Yard', state: 'Telangana', district: 'Warangal', min_price: 4000, max_price: 5000, modal_price: 4500, trend: 'stable', lat: 17.9889, lng: 79.6141 },
      { id: 50, commodity: 'Sugarcane', variety: 'Co-86032', market: 'Warangal City Market', state: 'Telangana', district: 'Warangal', min_price: 280, max_price: 320, modal_price: 300, trend: 'stable', lat: 17.9689, lng: 79.5941 },
      { id: 51, commodity: 'Cauliflower', variety: 'Snowball', market: 'Singh Nagar Market', state: 'Andhra Pradesh', district: 'Krishna', min_price: 1600, max_price: 2200, modal_price: 1900, trend: 'up', lat: 16.5362, lng: 80.6380 },
      { id: 52, commodity: 'Paddy', variety: 'Common', market: 'Gollapudi Market Yard', state: 'Andhra Pradesh', district: 'Krishna', min_price: 2100, max_price: 2300, modal_price: 2200, trend: 'stable', lat: 16.5462, lng: 80.5980 }
    ]

    localData.marketPrices = marketPrices
    console.log('✅ Seeded market data with', marketPrices.length, 'comprehensive crop records')
  }
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

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture: photoUrl } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let user = await findUser(email);

    if (!user) {
      // Create new user (password is random/dummy for google users)
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(dummyPassword, 10);

      const result = await createUser(name || email.split('@')[0], email, passwordHash);
      user = { id: result.insertId, name: name || email.split('@')[0], email };
    }

    // Generate token
    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: authToken,
      user: { id: user.id, name: user.name, email: user.email, photoUrl }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
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
app.get('/api/market/compare', async (req, res) => {
  try {
    const { crop, location } = req.query
    let prices = []

    if (useLocalStorage) {
      prices = [...localData.marketPrices]
    } else {
      const [dbPrices] = await db.execute('SELECT * FROM market_prices')
      prices = dbPrices
    }

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
      lat: item.lat || item.latitude,
      lng: item.lng || item.longitude,
      date: item.date || new Date().toISOString().split('T')[0]
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Market comparison error:', error)
    res.status(500).json({ error: 'Failed to fetch comparison data' })
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