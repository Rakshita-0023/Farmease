const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || undefined,
  user: process.env.MYSQL_USER || undefined,
  password: process.env.MYSQL_PASSWORD || undefined,
  database: process.env.MYSQL_DATABASE || undefined,
  port: process.env.MYSQL_PORT || 3306,

  // If using DATABASE_URL (Railway)
  uri: process.env.DATABASE_URL,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;