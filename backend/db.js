// Database connection - PostgreSQL in production, SQLite in development

let pool;
let dbType = 'none';

if (process.env.DATABASE_URL) {
  // ========== PRODUCTION: PostgreSQL or MySQL ==========
  const isPostgres = process.env.DATABASE_URL.startsWith('postgres');
  const isMySQL = process.env.DATABASE_URL.startsWith('mysql');
  
  if (isPostgres) {
    // PostgreSQL (Render, Supabase, Neon, etc.)
    dbType = 'postgres';
    console.log('📊 DATABASE_URL detected - Using PostgreSQL');
    
    const { Pool } = require('pg');
    
    const pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('render.com') 
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });
    
    console.log('✅ PostgreSQL connection pool created');
    
    // Wrap PostgreSQL to return MySQL-compatible format [rows, fields]
    pool = {
      query: async (sql, params = []) => {
        // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
        let pgSql = sql;
        let paramIndex = 0;
        pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
        
        const result = await pgPool.query(pgSql, params);
        return [result.rows, result.fields];
      },
      execute: async (sql, params = []) => {
        // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
        let pgSql = sql;
        let paramIndex = 0;
        pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
        
        // For INSERT, add RETURNING id to get the inserted ID
        if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
          pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
        }
        
        const result = await pgPool.query(pgSql, params);
        return [{
          insertId: result.rows[0]?.id || null,
          affectedRows: result.rowCount
        }];
      }
    };
    
  } else if (isMySQL) {
    // MySQL (Railway, PlanetScale, etc.)
    dbType = 'mysql';
    console.log('📊 DATABASE_URL detected - Using MySQL');
    
    const mysql = require('mysql2/promise');
    
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 30000,
    });
    
    console.log('✅ MySQL connection pool created');
  } else {
    console.error('❌ Unknown DATABASE_URL format');
  }
  
} else {
  // ========== DEVELOPMENT: SQLite ==========
  dbType = 'sqlite';
  console.log('📊 No DATABASE_URL - Using SQLite for development');
  
  // Only require sqlite3 when actually needed (optional dependency)
  let sqlite3;
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (err) {
    console.error('❌ SQLite3 not installed. Install with: npm install sqlite3');
    console.error('   Or set DATABASE_URL for PostgreSQL/MySQL');
    process.exit(1);
  }
  
  const path = require('path');
  
  const dbPath = process.env.FARMEASE_DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.FARMEASE_DATABASE_PATH)
    : path.join(__dirname, 'farmease.db');
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
    },
    close: () => new Promise((resolve, reject) => {
      sqliteDb.close(err => err ? reject(err) : resolve());
    })
  };
}

module.exports = pool;
module.exports.dbType = dbType;
