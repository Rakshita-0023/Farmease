// Non-destructive PostgreSQL migration entrypoint for ECS one-off tasks.
// The application startup also creates these tables for backward compatibility,
// but production rollouts should run this command before updating ECS services.
const db = require('../db');

const tables = [
  `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, city VARCHAR(255), state VARCHAR(255), country VARCHAR(255) DEFAULT 'India', latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS farms (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), name VARCHAR(255) NOT NULL, crop VARCHAR(255) NOT NULL, area DECIMAL(10, 2) NOT NULL, soil_type VARCHAR(100), planting_date DATE, health_score INTEGER DEFAULT 100, days_to_harvest INTEGER, progress INTEGER DEFAULT 0, latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), farm_id INTEGER REFERENCES farms(id), type VARCHAR(100) NOT NULL, details TEXT, quantity TEXT, date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS plant_diagnoses (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), disease VARCHAR(255), confidence DECIMAL(5, 2), symptoms TEXT, remedy TEXT, type VARCHAR(100), image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS forum_posts (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), content TEXT NOT NULL, tags TEXT, likes INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES forum_posts(id), user_id INTEGER NOT NULL REFERENCES users(id), content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS market_prices (id SERIAL PRIMARY KEY, commodity TEXT NOT NULL, variety TEXT, market TEXT NOT NULL, district TEXT NOT NULL, state TEXT NOT NULL, min_price DECIMAL(10, 2) NOT NULL, max_price DECIMAL(10, 2) NOT NULL, modal_price DECIMAL(10, 2) NOT NULL, latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), trend VARCHAR(50) DEFAULT 'stable', date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS charchas (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, visibility TEXT NOT NULL, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, charcha_id INTEGER NOT NULL REFERENCES charchas(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(charcha_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS join_requests (id SERIAL PRIMARY KEY, charcha_id INTEGER NOT NULL REFERENCES charchas(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(charcha_id, user_id, status))`,
  `CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, charcha_id INTEGER NOT NULL REFERENCES charchas(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS mentions (id SERIAL PRIMARY KEY, message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE, mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, related_id INTEGER, message TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
];

async function main() {
  if (db.dbType !== 'postgres') throw new Error(`db:migrate requires PostgreSQL; detected ${db.dbType}`);
  try {
    for (const sql of tables) await db.query(sql);
    console.log(`FarmEase PostgreSQL migrations complete (${tables.length} idempotent statements)`);
  } finally {
    if (db.close) await db.close();
  }
}

main().catch((error) => {
  console.error(`FarmEase PostgreSQL migration failed: ${error.message}`);
  process.exitCode = 1;
});
