-- Kisan Charcha Community Discussion System
-- Migration: Create all tables for the community discussion feature

-- 1. Charchas Table (Discussion Groups)
CREATE TABLE IF NOT EXISTS charchas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General')),
  visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_charchas_owner ON charchas(owner_id);
CREATE INDEX IF NOT EXISTS idx_charchas_category ON charchas(category);
CREATE INDEX IF NOT EXISTS idx_charchas_visibility ON charchas(visibility);

-- 2. Members Table (Charcha Membership)
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('OWNER', 'MODERATOR', 'MEMBER')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(charcha_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_charcha ON members(charcha_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);

-- 3. Join Requests Table
CREATE TABLE IF NOT EXISTS join_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(charcha_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_charcha ON join_requests(charcha_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_charcha ON messages(charcha_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 5. Mentions Table
CREATE TABLE IF NOT EXISTS mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  mentioned_user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mentions_message ON mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(mentioned_user_id);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('MENTION', 'JOIN_REQUEST', 'JOIN_APPROVED', 'JOIN_REJECTED')),
  related_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
