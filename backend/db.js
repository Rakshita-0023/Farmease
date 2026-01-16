const mysql = require("mysql2/promise");

// Use Railway MySQL in production, SQLite in development
let pool;

if (process.env.DATABASE_URL) {
  // Production: Railway MySQL
  console.log('📊 Using Railway MySQL Database');
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
  });
} else {
  // Development: SQLite
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'farmease.db');
  console.log('📊 Using SQLite Database:', dbPath);
  
  const sqliteDb = new sqlite3.Database(dbPath);
  
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