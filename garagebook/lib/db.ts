import Database from 'better-sqlite3';
import path from 'path';

// Use __dirname-equivalent for reliable path in Next.js
const DB_PATH = path.join(process.cwd(), 'garagebook.db');

declare global { var _db: Database.Database | undefined; }

const db: Database.Database = global._db ?? new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Persist across hot reloads in dev only
if (process.env.NODE_ENV !== 'production') global._db = db;

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    stock      INTEGER NOT NULL DEFAULT 0,
    price      REAL    NOT NULL DEFAULT 0,
    buy_price  REAL    NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT DEFAULT '',
    address    TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    item_name   TEXT    NOT NULL,
    qty         INTEGER NOT NULL,
    amount      REAL    NOT NULL,
    buy_price   REAL    NOT NULL DEFAULT 0,
    payment     TEXT    NOT NULL CHECK(payment IN ('cash','online','udhaar')),
    customer    TEXT    DEFAULT 'Walk-in',
    phone       TEXT    DEFAULT '',
    date        TEXT    DEFAULT (datetime('now','localtime')),
    udhaar_paid INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS returns (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id   INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    item_id   INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    item_name TEXT    NOT NULL,
    qty       INTEGER NOT NULL,
    amount    REAL    NOT NULL,
    reason    TEXT    DEFAULT '',
    date      TEXT    DEFAULT (datetime('now','localtime'))
  );
`);

export default db;
