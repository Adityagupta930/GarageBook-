const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'garagebook.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    stock       INTEGER NOT NULL DEFAULT 0,
    price       REAL    NOT NULL DEFAULT 0,
    buy_price   REAL    NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT DEFAULT '',
    address    TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    item_name   TEXT    NOT NULL,
    qty         INTEGER NOT NULL,
    amount      REAL    NOT NULL,
    buy_price   REAL    NOT NULL DEFAULT 0,
    payment     TEXT    NOT NULL,
    customer    TEXT    DEFAULT 'Walk-in',
    phone       TEXT    DEFAULT '',
    date        TEXT    DEFAULT (datetime('now')),
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
    date      TEXT    DEFAULT (datetime('now'))
  );
`);

module.exports = db;
