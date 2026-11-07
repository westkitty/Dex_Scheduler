-- DEX Scheduler private Cloudflare D1 schema. Apply only to the intended D1 database.
CREATE TABLE IF NOT EXISTS identities (
  role TEXT PRIMARY KEY CHECK (role IN ('andrew', 'greyson')),
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('andrew', 'greyson')),
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entry_tickets (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_attempts (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS schedules (
  role TEXT PRIMARY KEY CHECK (role IN ('andrew', 'greyson')),
  revision INTEGER NOT NULL DEFAULT 0,
  events_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT,
  FOREIGN KEY (role) REFERENCES identities(role)
);
CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('batch', 'urgent')),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  owner TEXT NOT NULL CHECK (owner IN ('andrew', 'greyson', 'shared')),
  due_date TEXT NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('none', 'monthly')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bill_payments (
  bill_id TEXT NOT NULL,
  occurrence_date TEXT NOT NULL,
  paid_date TEXT NOT NULL,
  paid_by TEXT NOT NULL CHECK (paid_by IN ('andrew', 'greyson')),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (bill_id, occurrence_date),
  FOREIGN KEY (bill_id) REFERENCES bills(id)
);
CREATE TABLE IF NOT EXISTS interests (
  role TEXT PRIMARY KEY CHECK (role IN ('andrew', 'greyson')),
  tags_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
