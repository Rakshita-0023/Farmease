const mysql = require("mysql2/promise");

// Database connection - MySQL in production, SQLite in development
let pool;
let dbType = 'none';

if (process.env.DATABASE_URL) {
  // ========== PRODUCTION: Railway MySQL ==========
  dbType = 'mysql';
  console.log('📊 DATABASE_URL detected - Using MySQL');
  
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 30000,
    acquireTimeout: 30000,
  });
  
  console.log('✅ MySQL connection pool created');
  
} else {
  // ========== DEVELOPMENT: SQLite ==========
  dbType = 'sqlite';
  console.log('📊 No DATABASE_URL - Using SQLite for development');
  
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'farmease.db');
  console.log('📊 SQLite Database path:', dbPath);
  
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ SQLite connection error:', err.message);
    } else {
      console.log('✅ SQLite database connected');
    }
  });
  
  // Promisify SQLite for async/await compatibility
  pool = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows]);
        });
      });
    },
    
    execute: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      });
    }
  };
}

module.exports = pool;
module.exports.dbType = dbType;