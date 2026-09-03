const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databasePath = process.env.FARMEASE_DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.FARMEASE_DATABASE_PATH)
  : path.join(__dirname, '..', 'farmease.db');
const migrations = ['000_core_schema.sql', '001_create_kisan_charcha_tables.sql'];

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new sqlite3.Database(databasePath);
const sql = migrations.map((file) => fs.readFileSync(path.join(__dirname, '..', 'migrations', file), 'utf8')).join('\n');

db.exec(sql, (err) => {
  if (err) {
    console.error(`Database setup failed: ${err.message}`);
    process.exitCode = 1;
  } else {
    console.log(`FarmEase SQLite schema is ready: ${databasePath}`);
  }
  db.close();
});
