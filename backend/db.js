// Database connection - PostgreSQL in production, SQLite in development

let pool;
let dbType = 'none';

// AWS ECS injects database credentials as separate Secrets Manager values.
// Keep DATABASE_URL supported for Render/local deployments, but make the
// component form first-class so credentials never need to be assembled in
// Terraform or committed to the repository.
const configuredDatabaseUrl = process.env.DATABASE_URL || (
  process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD
    ? `postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${encodeURIComponent(process.env.DB_NAME || 'farmease')}`
    : null
);
const hasDatabaseComponents = Boolean(process.env.DB_HOST || process.env.DB_USER || process.env.DB_PASSWORD);

if (configuredDatabaseUrl) {
  // ========== PRODUCTION: PostgreSQL or MySQL ==========
  const isPostgres = configuredDatabaseUrl.startsWith('postgres');
  const isMySQL = configuredDatabaseUrl.startsWith('mysql');
  
  if (isPostgres) {
    // PostgreSQL (Render, Supabase, Neon, etc.)
    dbType = 'postgres';
    console.log('📊 DATABASE_URL detected - Using PostgreSQL');
    
    const { Pool } = require('pg');

    // Render's internal PostgreSQL hostname is commonly a dpg-* address, not
    // a render.com hostname. Use the provider's TLS setup for every configured
    // production PostgreSQL URL unless the URL explicitly disables SSL.
    let postgresSsl = { rejectUnauthorized: false };
    try {
      const databaseUrl = new URL(configuredDatabaseUrl);
      if (databaseUrl.searchParams.get('sslmode') === 'disable') postgresSsl = false;
    } catch (error) {
      console.error('❌ DATABASE_URL is not a valid PostgreSQL URL:', error.message);
    }
    
    const pgPool = new Pool({
      connectionString: configuredDatabaseUrl,
      ssl: postgresSsl,
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
      },
      close: () => pgPool.end()
    };
    
  } else if (isMySQL) {
    // MySQL (Railway, PlanetScale, etc.)
    dbType = 'mysql';
    console.log('📊 DATABASE_URL detected - Using MySQL');
    
    const mysql = require('mysql2/promise');
    
    pool = mysql.createPool({
      uri: configuredDatabaseUrl,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 30000,
    });
    
    console.log('✅ MySQL connection pool created');
  } else {
    console.error('❌ Unknown DATABASE_URL format');
  }
} else if (hasDatabaseComponents) {
  // Do not silently fall back to SQLite if ECS secret injection is incomplete.
  dbType = 'postgres';
  console.error('❌ Incomplete AWS database configuration: DB_HOST, DB_USER, and DB_PASSWORD are all required');
  pool = {
    query: async () => { throw new Error('Incomplete PostgreSQL configuration'); },
    execute: async () => { throw new Error('Incomplete PostgreSQL configuration'); },
    close: async () => {}
  };
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
