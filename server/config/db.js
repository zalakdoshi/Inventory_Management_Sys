const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || './database.db';
const dbFile = path.resolve(DB_PATH);

let db;

const connectDB = () => {
  try {
    db = new Database(dbFile);
    db.pragma('journal_mode = WAL');   // Better concurrency
    db.pragma('foreign_keys = ON');    // Enforce FK constraints
    createTables();
    logger.info(`✅ SQLite Database connected: ${dbFile}`);
  } catch (error) {
    logger.error(`❌ SQLite Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getDb = () => {
  if (!db) throw new Error('Database not initialized. Call connectDB() first.');
  return db;
};

const createTables = () => {
  db.exec(`
    -- ── Users ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'salesman' CHECK(role IN ('admin','purchaser','salesman')),
      phone       TEXT,
      avatar      TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      last_login  TEXT,
      created_by  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Suppliers ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS suppliers (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      contact_person TEXT,
      phone          TEXT,
      email          TEXT,
      gstin          TEXT,
      address        TEXT DEFAULT '{}',
      categories     TEXT DEFAULT '[]',
      is_active      INTEGER NOT NULL DEFAULT 1,
      notes          TEXT,
      created_by     TEXT REFERENCES users(id),
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Products ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS products (
      id             TEXT PRIMARY KEY,
      product_id     TEXT NOT NULL UNIQUE,
      name           TEXT NOT NULL,
      category       TEXT NOT NULL,
      selling_price  REAL NOT NULL DEFAULT 0,
      purchase_price REAL NOT NULL DEFAULT 0,
      quantity       INTEGER NOT NULL DEFAULT 0,
      unit           TEXT NOT NULL DEFAULT 'Piece',
      supplier_id    TEXT REFERENCES suppliers(id),
      gst_percentage INTEGER NOT NULL DEFAULT 18,
      hsn_code       TEXT DEFAULT '9999',
      barcode        TEXT,
      description    TEXT DEFAULT '',
      image          TEXT,
      reorder_level  INTEGER NOT NULL DEFAULT 10,
      status         TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','discontinued')),
      created_by     TEXT REFERENCES users(id),
      updated_by     TEXT REFERENCES users(id),
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Orders ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS orders (
      id             TEXT PRIMARY KEY,
      order_id       TEXT NOT NULL UNIQUE,
      customer       TEXT NOT NULL DEFAULT '{}',
      items          TEXT NOT NULL DEFAULT '[]',
      subtotal       REAL NOT NULL DEFAULT 0,
      discount       REAL NOT NULL DEFAULT 0,
      tax_amount     REAL NOT NULL DEFAULT 0,
      total_amount   REAL NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','pending','approved','packed','dispatched','delivered','cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','partial','paid')),
      payment_mode   TEXT NOT NULL DEFAULT 'cash',
      timeline       TEXT NOT NULL DEFAULT '[]',
      is_gst_invoice INTEGER NOT NULL DEFAULT 1,
      tax_type       TEXT NOT NULL DEFAULT 'cgst_sgst',
      created_by     TEXT REFERENCES users(id),
      bill_id        TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Bills ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bills (
      id              TEXT PRIMARY KEY,
      bill_id         TEXT NOT NULL UNIQUE,
      order_id        TEXT REFERENCES orders(id),
      customer        TEXT NOT NULL DEFAULT '{}',
      company         TEXT NOT NULL DEFAULT '{}',
      items           TEXT NOT NULL DEFAULT '[]',
      subtotal        REAL NOT NULL DEFAULT 0,
      discount        REAL NOT NULL DEFAULT 0,
      cgst_total      REAL NOT NULL DEFAULT 0,
      sgst_total      REAL NOT NULL DEFAULT 0,
      igst_total      REAL NOT NULL DEFAULT 0,
      tax_total       REAL NOT NULL DEFAULT 0,
      round_off       REAL NOT NULL DEFAULT 0,
      grand_total     REAL NOT NULL DEFAULT 0,
      tax_type        TEXT NOT NULL DEFAULT 'cgst_sgst',
      payment_mode    TEXT NOT NULL DEFAULT 'cash',
      payment_status  TEXT NOT NULL DEFAULT 'unpaid',
      irn             TEXT,
      qr_code         TEXT,
      ack_number      TEXT,
      ack_date        TEXT,
      terms_conditions TEXT DEFAULT 'Goods once sold will not be taken back. Subject to Anand jurisdiction.',
      pdf_path        TEXT,
      created_by      TEXT REFERENCES users(id),
      bill_date       TEXT NOT NULL DEFAULT (datetime('now')),
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Purchases ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS purchases (
      id             TEXT PRIMARY KEY,
      purchase_id    TEXT NOT NULL UNIQUE,
      supplier_id    TEXT REFERENCES suppliers(id),
      supplier_name  TEXT,
      items          TEXT NOT NULL DEFAULT '[]',
      subtotal       REAL NOT NULL DEFAULT 0,
      tax_amount     REAL NOT NULL DEFAULT 0,
      total_amount   REAL NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'ordered' CHECK(status IN ('draft','ordered','received','cancelled')),
      purchase_date  TEXT NOT NULL DEFAULT (datetime('now')),
      notes          TEXT,
      purchased_by   TEXT REFERENCES users(id),
      received_date  TEXT,
      invoice_number TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Activity Logs ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT,
      user_name   TEXT DEFAULT 'System',
      user_role   TEXT DEFAULT 'system',
      action      TEXT NOT NULL,
      module      TEXT NOT NULL,
      description TEXT NOT NULL,
      details     TEXT DEFAULT 'null',
      ip_address  TEXT,
      user_agent  TEXT,
      severity    TEXT NOT NULL DEFAULT 'low' CHECK(severity IN ('low','medium','high')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Password Reset Requests ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id                  TEXT PRIMARY KEY,
      user_id             TEXT REFERENCES users(id),
      user_name           TEXT NOT NULL,
      user_email          TEXT NOT NULL,
      user_role           TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reset_token         TEXT,
      reset_token_expiry  TEXT,
      approved_by         TEXT REFERENCES users(id),
      admin_note          TEXT,
      resolved_at         TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Notifications ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      message    TEXT,
      type       TEXT DEFAULT 'info',
      is_read    INTEGER NOT NULL DEFAULT 0,
      user_id    TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  logger.info('✅ All SQLite tables ready.');
};

module.exports = { connectDB, getDb };
