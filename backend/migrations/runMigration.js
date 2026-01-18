const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(__dirname, '..', 'farmease.db');
const migrationFile = path.join(__dirname, '001_create_kisan_charcha_tables.sql');

console.log('🚀 Running Kisan Charcha database migration...');
console.log('📊 Database:', dbPath);
console.log('📄 Migration file:', migrationFile);

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Execute migration
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('❌ Migration failed:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('📋 Created tables:');
  console.log('   - charchas');
  console.log('   - members');
  console.log('   - join_requests');
  console.log('   - messages');
  console.log('   - mentions');
  console.log('   - notifications');
  
  // Verify tables were created
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%charcha%' OR name IN ('members', 'messages', 'mentions', 'notifications', 'join_requests')", [], (err, rows) => {
    if (err) {
      console.error('❌ Verification error:', err.message);
    } else {
      console.log('\n✅ Verified tables in database:');
      rows.forEach(row => console.log(`   - ${row.name}`));
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('\n✅ Database connection closed');
      }
    });
  });
});
