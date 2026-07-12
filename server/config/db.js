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

  // Auto-seed default users if purchaser doesn't exist
  const purchaserExists = db.prepare('SELECT COUNT(*) as c FROM users WHERE LOWER(email) = LOWER(?)').get('purchaser@vardhman.com').c;
  if (purchaserExists === 0) {
    logger.info('🌱 Seeding default database users and products...');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const now = () => new Date().toISOString();

    // 1. Seed Users
    const users = [
      { id: uuidv4(), name: 'Admin User', email: 'admin@vardhman.com', password: hash('admin123'), role: 'admin', phone: '+91 9998160084' },
      { id: uuidv4(), name: 'Ravi Patel', email: 'purchaser@vardhman.com', password: hash('purchaser123'), role: 'purchaser', phone: '+91 9876543210' },
      { id: uuidv4(), name: 'Suresh Kumar', email: 'salesman@vardhman.com', password: hash('salesman123'), role: 'salesman', phone: '+91 9123456789' },
      { id: uuidv4(), name: 'Priya Shah', email: 'salesman2@vardhman.com', password: hash('salesman123'), role: 'salesman', phone: '+91 9012345678' }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, phone, is_active, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    users.forEach(u => {
      const exists = db.prepare('SELECT COUNT(*) as c FROM users WHERE LOWER(email) = LOWER(?)').get(u.email).c;
      if (exists === 0) {
        insertUser.run(u.id, u.name, u.email.toLowerCase(), u.password, u.role, u.phone, now(), now());
        logger.info(`👤 Seeded user: ${u.email}`);
      }
    });

    // Find admin user ID to associate with created suppliers/products
    const adminId = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin')?.id || users[0].id;

    // 2. Seed Suppliers
    const suppliers = [
      {
        id: uuidv4(),
        name: 'Gujarat Biogas Equipments Pvt Ltd',
        contact_person: 'Ramesh Patel',
        phone: '+91 9876543210',
        email: 'gujarat.biogas@example.com',
        gstin: '24AABCG1234A1Z5',
        address: JSON.stringify({ street: 'GIDC Estate', city: 'Anand', state: 'Gujarat', pincode: '388001' }),
        categories: JSON.stringify(['Biogas Components', 'Storage Equipment']),
        notes: '',
        created_by: adminId
      },
      {
        id: uuidv4(),
        name: 'CNG Solutions India',
        contact_person: 'Mahesh Shah',
        phone: '+91 9988776655',
        email: 'cngsolutions@example.com',
        gstin: '24AABCC5678A1Z3',
        address: JSON.stringify({ street: 'Industrial Area', city: 'Vadodara', state: 'Gujarat', pincode: '390001' }),
        categories: JSON.stringify(['CNG Equipment', 'Compressors']),
        notes: '',
        created_by: adminId
      },
      {
        id: uuidv4(),
        name: 'Pipe & Valve Traders',
        contact_person: 'Suresh Mehta',
        phone: '+91 9123456789',
        email: 'pipetrades@example.com',
        gstin: '24AABCP9012A1Z1',
        address: JSON.stringify({ street: 'Market Yard', city: 'Surat', state: 'Gujarat', pincode: '395001' }),
        categories: JSON.stringify(['Pipes', 'Valves', 'Fittings']),
        notes: '',
        created_by: adminId
      }
    ];

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (id, name, contact_person, phone, email, gstin, address, categories, is_active, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    suppliers.forEach(s => insertSupplier.run(s.id, s.name, s.contact_person, s.phone, s.email, s.gstin, s.address, s.categories, s.notes, s.created_by, now(), now()));
    logger.info(`🏭 Seeded ${suppliers.length} suppliers.`);

    // 3. Seed Products
    const genProductId = () => 'PRD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    const products = [
      { name: 'Biogas Plant Inlet Tank 1000L', category: 'Biogas Components', sellingPrice: 28500, purchasePrice: 22000, quantity: 15, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 5, supplier_id: suppliers[0].id, description: 'Heavy duty HDPE inlet tank for 1000L biogas plants', barcode: 'BG001' },
      { name: 'Dome Gas Holder 500L', category: 'Biogas Components', sellingPrice: 18000, purchasePrice: 14000, quantity: 20, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 8, supplier_id: suppliers[0].id, description: 'Fixed dome gas holder for medium biogas plants', barcode: 'BG002' },
      { name: 'Biogas Burner Single Nozzle', category: 'Biogas Components', sellingPrice: 850, purchasePrice: 600, quantity: 120, unit: 'Piece', gstPercentage: 12, hsnCode: '8419', reorderLevel: 30, supplier_id: suppliers[0].id, description: 'Cast iron single nozzle biogas burner', barcode: 'BG003' },
      { name: 'CNG Cylinder Type I 50L', category: 'CNG Equipment', sellingPrice: 12500, purchasePrice: 9500, quantity: 25, unit: 'Piece', gstPercentage: 18, hsnCode: '8412', reorderLevel: 5, supplier_id: suppliers[1].id, description: 'BIS approved 50L CNG cylinder, 200 bar', barcode: 'CNG001' },
      { name: 'CNG Pressure Regulator 200bar', category: 'CNG Equipment', sellingPrice: 3800, purchasePrice: 2800, quantity: 40, unit: 'Piece', gstPercentage: 18, hsnCode: '8412', reorderLevel: 10, supplier_id: suppliers[1].id, description: '200 bar to 4 bar CNG pressure regulator', barcode: 'CNG002' },
      { name: 'MS Seamless Pipe 1 inch (6m)', category: 'Pipes', sellingPrice: 1200, purchasePrice: 900, quantity: 200, unit: 'Piece', gstPercentage: 18, hsnCode: '7304', reorderLevel: 50, supplier_id: suppliers[2].id, description: 'MS seamless pipe 1 inch schedule 40', barcode: 'PIPE002' }
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (id, product_id, name, category, selling_price, purchase_price, quantity, unit, supplier_id, gst_percentage, hsn_code, barcode, description, image, reorder_level, status, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?, 'active', ?, ?, ?, ?)
    `);

    products.forEach(p => {
      const pid = uuidv4();
      const pno = genProductId();
      insertProduct.run(pid, pno, p.name, p.category, p.sellingPrice, p.purchasePrice, p.quantity, p.unit, p.supplier_id, p.gstPercentage, p.hsnCode, p.barcode, p.description, p.reorderLevel, adminId, adminId, now(), now());
    });
    logger.info(`📦 Seeded ${products.length} products.`);
    logger.info('🌱 SQLite Seeding finished successfully.');
  }
};

module.exports = { connectDB, getDb };
