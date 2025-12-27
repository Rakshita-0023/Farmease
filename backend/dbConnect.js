const mysql = require('mysql2/promise')
require('dotenv').config()

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

let pool = null

// Initialize connection pool
const getDb = async () => {
    if (!pool) {
        try {
            pool = mysql.createPool(dbConfig)
            // Test connection
            const connection = await pool.getConnection()
            console.log('✅ Connected to Database Pool')
            connection.release()
        } catch (error) {
            console.error('❌ Database connection failed:', error.message)
            // Return null to signal fallback to local storage
            return null
        }
    }
    return pool
}

module.exports = { getDb }
