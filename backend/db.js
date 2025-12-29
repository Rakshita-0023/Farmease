const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});

// Don't auto-connect for development - let the app handle it
// (async () => {
//   try {
//     await pool.query("SELECT 1");
//     console.log("✅ Railway MySQL connected successfully");
//   } catch (err) {
//     console.error("❌ Database connection failed:", err.message);
//     process.exit(1);
//   }
// })();

module.exports = pool;