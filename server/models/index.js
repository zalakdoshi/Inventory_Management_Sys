/**
 * SQLite Model Helpers
 * Replaces all Mongoose models with simple SQLite CRUD helpers.
 * All IDs are UUID v4. JSON columns stored as TEXT, parsed on read.
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');

// ── Helpers ────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const genId = () => uuidv4();
const j = (v) => JSON.stringify(v ?? null);
const p = (v) => { try { return v ? JSON.parse(v) : null; } catch { return v; } };

/** Map a raw DB row, parsing JSON columns by key list */
const parseRow = (row, jsonCols = []) => {
  if (!row) return null;
  const out = { ...row };
  for (const col of jsonCols) {
    if (col in out) out[col] = p(out[col]);
  }
  // Expose `_id` alias (for frontend compatibility)
  if (out.id) out._id = out.id;
  return out;
};

const genProductId = () =>
  'PRD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

// ── USER ───────────────────────────────────────────────────────────────────
const User = {
  async create({ name, email, password, role = 'salesman', phone = '', createdBy = null }) {
    const db = getDb();
    const hash = await bcrypt.hash(password, 10);
    const id = genId();
    db.prepare(`INSERT INTO users (id,name,email,password,role,phone,is_active,created_by,created_at,updated_at)
      VALUES (?,?,?,?,?,?,1,?,?,?)`).run(id, name, email.toLowerCase(), hash, role, phone || '', createdBy, now(), now());
    return this.findById(id);
  },
  findById(id) {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    return parseRow(row);
  },
  findOne(where) {
    const db = getDb();
    if (where.email) {
      return parseRow(db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(where.email));
    }
    if (where.id) return this.findById(where.id);
    return null;
  },
  findByIdWithPassword(id) {
    return parseRow(getDb().prepare('SELECT * FROM users WHERE id = ?').get(id));
  },
  findOneWithPassword(email) {
    return parseRow(getDb().prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email));
  },
  find({ role = '', search = '', page = 1, limit = 10 } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const total = db.prepare(`SELECT COUNT(*) as c FROM users WHERE 1=1${role ? ' AND role=?' : ''}${search ? ' AND (name LIKE ? OR email LIKE ?)' : ''}`)
      .get(...params).c;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const rows = db.prepare(sql).all(...params).map(r => parseRow(r));
    return { rows, total };
  },
  findAll({ role, isActive } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (isActive !== undefined) { sql += ' AND is_active = ?'; params.push(isActive ? 1 : 0); }
    return db.prepare(sql).all(...params).map(r => parseRow(r));
  },
  countDocuments({ isActive } = {}) {
    const db = getDb();
    if (isActive !== undefined) return db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active=?').get(isActive ? 1 : 0).c;
    return db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  },
  update(id, fields) {
    const db = getDb();
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${sets}, updated_at = ? WHERE id = ?`).run(...Object.values(fields), now(), id);
    return this.findById(id);
  },
  async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    getDb().prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, now(), id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  },
  async comparePassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },
};

// ── SUPPLIER ───────────────────────────────────────────────────────────────
const Supplier = {
  create(data) {
    const db = getDb();
    const id = genId();
    db.prepare(`INSERT INTO suppliers (id,name,contact_person,phone,email,gstin,address,categories,is_active,notes,created_by,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,1,?,?,?,?)`).run(
      id, data.name, data.contactPerson || '', data.phone || '', data.email || '',
      data.gstin || '', j(data.address || {}), j(data.categories || []),
      data.notes || '', data.createdBy || null, now(), now()
    );
    return this.findById(id);
  },
  findById(id) {
    return parseRow(getDb().prepare('SELECT * FROM suppliers WHERE id = ?').get(id), ['address', 'categories']);
  },
  find({ isActive } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];
    if (isActive !== undefined) { sql += ' AND is_active = ?'; params.push(isActive ? 1 : 0); }
    sql += ' ORDER BY name ASC';
    return db.prepare(sql).all(...params).map(r => parseRow(r, ['address', 'categories']));
  },
  update(id, data) {
    const db = getDb();
    const fields = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.phone !== undefined) fields.phone = data.phone;
    if (data.email !== undefined) fields.email = data.email;
    if (data.gstin !== undefined) fields.gstin = data.gstin;
    if (data.isActive !== undefined) fields.is_active = data.isActive ? 1 : 0;
    if (data.categories !== undefined) fields.categories = j(data.categories);
    if (data.address !== undefined) fields.address = j(data.address);
    if (data.notes !== undefined) fields.notes = data.notes;
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE suppliers SET ${sets}, updated_at = ? WHERE id = ?`).run(...Object.values(fields), now(), id);
    return this.findById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  },
};

// ── PRODUCT ────────────────────────────────────────────────────────────────
const Product = {
  create(data) {
    const db = getDb();
    const id = genId();
    const productId = data.productId || genProductId();
    db.prepare(`INSERT INTO products
      (id,product_id,name,category,selling_price,purchase_price,quantity,unit,supplier_id,gst_percentage,hsn_code,barcode,description,image,reorder_level,status,created_by,updated_by,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, productId, data.name, data.category,
      parseFloat(data.sellingPrice) || 0, parseFloat(data.purchasePrice) || 0,
      parseInt(data.quantity) || 0, data.unit || 'Piece',
      data.supplier || null, parseInt(data.gstPercentage) || 18,
      data.hsnCode || '9999', data.barcode || null,
      data.description || '', data.image || null,
      parseInt(data.reorderLevel) || 10, data.status || 'active',
      data.createdBy || null, data.updatedBy || null, now(), now()
    );
    return this.findById(id);
  },
  findById(id) {
    const row = getDb().prepare(`
      SELECT p.*, s.name as supplier_name, s.phone as supplier_phone, s.email as supplier_email
      FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?`).get(id);
    return this._format(row);
  },
  _format(row) {
    if (!row) return null;
    const r = parseRow(row);
    if (r.supplier_id) {
      r.supplier = { _id: r.supplier_id, id: r.supplier_id, name: r.supplier_name, phone: r.supplier_phone, email: r.supplier_email };
    } else {
      r.supplier = null;
    }
    // camelCase aliases for frontend
    r.sellingPrice = r.selling_price;
    r.purchasePrice = r.purchase_price;
    r.gstPercentage = r.gst_percentage;
    r.hsnCode = r.hsn_code;
    r.reorderLevel = r.reorder_level;
    r.productId = r.product_id;
    r.createdBy = r.created_by;
    r.updatedBy = r.updated_by;
    r.createdAt = r.created_at;
    r.updatedAt = r.updated_at;
    return r;
  },
  find({ search = '', category = '', status = '', lowStock = '', page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    const db = getDb();
    let sql = `SELECT p.*, s.name as supplier_name, s.phone as supplier_phone, s.email as supplier_email
      FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.product_id LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) { sql += ' AND p.category = ?'; params.push(category); }
    if (status) { sql += ' AND p.status = ?'; params.push(status); }
    if (lowStock === 'true') sql += ' AND p.quantity <= p.reorder_level';

    const countSql = sql.replace(/SELECT p\.\*, s\..*FROM/, 'SELECT COUNT(*) as c FROM');
    const total = db.prepare(countSql).get(...params).c;

    const allowedSort = ['created_at', 'name', 'quantity', 'selling_price'];
    const col = allowedSort.includes(sortBy) ? `p.${sortBy}` : 'p.created_at';
    sql += ` ORDER BY ${col} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const rows = db.prepare(sql).all(...params).map(r => this._format(r));
    return { rows, total };
  },
  countDocuments({ status, lowStock } = {}) {
    const db = getDb();
    let sql = 'SELECT COUNT(*) as c FROM products WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (lowStock) sql += ' AND quantity <= reorder_level';
    return db.prepare(sql).get(...params).c;
  },
  update(id, data) {
    const db = getDb();
    const fields = {};
    const map = {
      name: 'name', category: 'category', status: 'status',
      description: 'description', image: 'image', barcode: 'barcode',
      sellingPrice: 'selling_price', purchasePrice: 'purchase_price',
      quantity: 'quantity', unit: 'unit', gstPercentage: 'gst_percentage',
      hsnCode: 'hsn_code', reorderLevel: 'reorder_level',
      supplier: 'supplier_id', updatedBy: 'updated_by',
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined && data[key] !== '') fields[col] = data[key];
    }
    if (!Object.keys(fields).length) return this.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE products SET ${sets}, updated_at = ? WHERE id = ?`).run(...Object.values(fields), now(), id);
    return this.findById(id);
  },
  incrementQuantity(id, delta) {
    getDb().prepare('UPDATE products SET quantity = quantity + ?, updated_at = ? WHERE id = ?').run(delta, now(), id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
  },
};

// ── ORDER ──────────────────────────────────────────────────────────────────
const Order = {
  _cols: ['customer', 'items', 'timeline'],
  create(data) {
    const db = getDb();
    const id = genId();
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    db.prepare(`INSERT INTO orders
      (id,order_id,customer,items,subtotal,discount,tax_amount,total_amount,status,payment_status,payment_mode,timeline,is_gst_invoice,tax_type,created_by,bill_id,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, orderId, j(data.customer), j(data.items),
      data.subtotal || 0, data.discount || 0, data.taxAmount || 0, data.totalAmount || 0,
      data.status || 'created', data.paymentStatus || 'unpaid',
      data.paymentMode || 'cash', j(data.timeline || []),
      data.isGstInvoice !== false ? 1 : 0, data.taxType || 'cgst_sgst',
      data.createdBy || null, data.billId || null, now(), now()
    );
    return this.findById(id);
  },
  findById(id) {
    const row = getDb().prepare(`
      SELECT o.*, u.name as creator_name, u.role as creator_role,
             b.bill_id as linked_bill_id, b.grand_total as bill_total
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN bills b ON o.bill_id = b.id
      WHERE o.id = ?`).get(id);
    return this._format(row);
  },
  _format(row) {
    if (!row) return null;
    const r = parseRow(row, this._cols);
    if (r.created_by) r.createdBy = { _id: r.created_by, id: r.created_by, name: r.creator_name, role: r.creator_role };
    if (r.bill_id) r.bill = { _id: r.bill_id, id: r.bill_id, billId: r.linked_bill_id, grandTotal: r.bill_total };
    r.orderId = r.order_id;
    r.paymentStatus = r.payment_status;
    r.paymentMode = r.payment_mode;
    r.taxAmount = r.tax_amount;
    r.totalAmount = r.total_amount;
    r.isGstInvoice = !!r.is_gst_invoice;
    r.taxType = r.tax_type;
    r.createdAt = r.created_at;
    r.updatedAt = r.updated_at;
    return r;
  },
  find({ status = '', search = '', createdBy = '', page = 1, limit = 10 } = {}) {
    const db = getDb();
    let sql = `SELECT o.*, u.name as creator_name, u.role as creator_role,
               b.bill_id as linked_bill_id, b.grand_total as bill_total
               FROM orders o LEFT JOIN users u ON o.created_by = u.id
               LEFT JOIN bills b ON o.bill_id = b.id WHERE 1=1`;
    const params = [];
    if (createdBy) { sql += ' AND o.created_by = ?'; params.push(createdBy); }
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    if (search) {
      sql += ' AND (o.order_id LIKE ? OR o.customer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const total = db.prepare(sql.replace(/SELECT o\.\*.*FROM orders/, 'SELECT COUNT(*) as c FROM orders')).get(...params).c;
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const rows = db.prepare(sql).all(...params).map(r => this._format(r));
    return { rows, total };
  },
  countDocuments(where = {}) {
    let sql = 'SELECT COUNT(*) as c FROM orders WHERE 1=1';
    const params = [];
    if (where.createdAt_gte) { sql += ' AND created_at >= ?'; params.push(where.createdAt_gte); }
    return getDb().prepare(sql).get(...params).c;
  },
  update(id, fields) {
    const db = getDb();
    const colMap = {
      status: 'status', paymentStatus: 'payment_status', billId: 'bill_id',
      timeline: null, customer: null, items: null,
    };
    const sets = [];
    const vals = [];
    for (const [k, col] of Object.entries(colMap)) {
      if (fields[k] !== undefined) {
        const c = col || k;
        sets.push(`${c} = ?`);
        vals.push(['timeline', 'customer', 'items'].includes(k) ? j(fields[k]) : fields[k]);
      }
    }
    if (!sets.length) return this.findById(id);
    db.prepare(`UPDATE orders SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, now(), id);
    return this.findById(id);
  },
};

// ── BILL ───────────────────────────────────────────────────────────────────
const Bill = {
  _cols: ['customer', 'company', 'items'],
  create(data) {
    const db = getDb();
    const id = genId();
    const billId = 'INV-' + Date.now().toString(36).toUpperCase();
    db.prepare(`INSERT INTO bills
      (id,bill_id,order_id,customer,company,items,subtotal,discount,cgst_total,sgst_total,igst_total,tax_total,round_off,grand_total,tax_type,payment_mode,payment_status,terms_conditions,created_by,bill_date,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, billId, data.order || null, j(data.customer), j(data.company || {}),
      j(data.items || []), data.subtotal || 0, data.discount || 0,
      data.cgstTotal || 0, data.sgstTotal || 0, data.igstTotal || 0,
      data.taxTotal || 0, data.roundOff || 0, data.grandTotal || 0,
      data.taxType || 'cgst_sgst', data.paymentMode || 'cash',
      data.paymentStatus || 'unpaid',
      data.termsConditions || 'Goods once sold will not be taken back. Subject to Anand jurisdiction.',
      data.createdBy || null, now(), now(), now()
    );
    return this.findById(id);
  },
  findById(id) {
    const row = getDb().prepare(`
      SELECT b.*, u.name as creator_name, u.role as creator_role,
             o.status as order_status, o.order_id as linked_order_id
      FROM bills b LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN orders o ON b.order_id = o.id WHERE b.id = ?`).get(id);
    return this._format(row);
  },
  _format(row) {
    if (!row) return null;
    const r = parseRow(row, this._cols);
    if (r.created_by) r.createdBy = { _id: r.created_by, id: r.created_by, name: r.creator_name, role: r.creator_role };
    if (r.order_id) r.order = { _id: r.order_id, id: r.order_id, status: r.order_status, orderId: r.linked_order_id };
    r.billId = r.bill_id;
    r.billDate = r.bill_date;
    r.cgstTotal = r.cgst_total;
    r.sgstTotal = r.sgst_total;
    r.igstTotal = r.igst_total;
    r.taxTotal = r.tax_total;
    r.grandTotal = r.grand_total;
    r.roundOff = r.round_off;
    r.paymentMode = r.payment_mode;
    r.paymentStatus = r.payment_status;
    r.taxType = r.tax_type;
    r.termsConditions = r.terms_conditions;
    r.createdAt = r.created_at;
    r.updatedAt = r.updated_at;
    return r;
  },
  find({ search = '', createdBy = '', page = 1, limit = 10 } = {}) {
    const db = getDb();
    let sql = `SELECT b.*, u.name as creator_name, u.role as creator_role,
               o.status as order_status, o.order_id as linked_order_id
               FROM bills b LEFT JOIN users u ON b.created_by = u.id
               LEFT JOIN orders o ON b.order_id = o.id WHERE 1=1`;
    const params = [];
    if (createdBy) { sql += ' AND b.created_by = ?'; params.push(createdBy); }
    if (search) { sql += ' AND (b.bill_id LIKE ? OR b.customer LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const total = db.prepare(sql.replace(/SELECT b\.\*.*FROM bills/, 'SELECT COUNT(*) as c FROM bills')).get(...params).c;
    sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    return { rows: db.prepare(sql).all(...params).map(r => this._format(r)), total };
  },
  findAll({ createdAt_gte } = {}) {
    let sql = `SELECT b.*, u.name as creator_name FROM bills b LEFT JOIN users u ON b.created_by = u.id WHERE 1=1`;
    const params = [];
    if (createdAt_gte) { sql += ' AND b.created_at >= ?'; params.push(createdAt_gte); }
    sql += ' ORDER BY b.created_at DESC';
    return getDb().prepare(sql).all(...params).map(r => this._format(r));
  },
  aggregate_total(where = {}) {
    let sql = 'SELECT COALESCE(SUM(grand_total),0) as total FROM bills WHERE 1=1';
    const params = [];
    if (where.createdAt_gte) { sql += ' AND created_at >= ?'; params.push(where.createdAt_gte); }
    return getDb().prepare(sql).get(...params).total;
  },
  revenueByMonth(year) {
    return getDb().prepare(`
      SELECT strftime('%m', created_at) as month, SUM(grand_total) as revenue, COUNT(*) as count
      FROM bills WHERE strftime('%Y', created_at) = ? GROUP BY month ORDER BY month ASC
    `).all(String(year));
  },
  update(id, fields) {
    const db = getDb();
    const sets = [];
    const vals = [];
    const colMap = { order: 'order_id', paymentStatus: 'payment_status' };
    for (const [k, col] of Object.entries(colMap)) {
      if (fields[k] !== undefined) { sets.push(`${col} = ?`); vals.push(fields[k]); }
    }
    if (!sets.length) return this.findById(id);
    db.prepare(`UPDATE bills SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, now(), id);
    return this.findById(id);
  },
};

// ── PURCHASE ───────────────────────────────────────────────────────────────
const Purchase = {
  create(data) {
    const db = getDb();
    const id = genId();
    const purchaseId = 'PO-' + Date.now().toString(36).toUpperCase();
    db.prepare(`INSERT INTO purchases
      (id,purchase_id,supplier_id,supplier_name,items,subtotal,tax_amount,total_amount,status,purchase_date,notes,purchased_by,invoice_number,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, purchaseId, data.supplier || null, data.supplierName || null,
      j(data.items || []), data.subtotal || 0, data.taxAmount || 0, data.totalAmount || 0,
      data.status || 'ordered', data.purchaseDate || now(),
      data.notes || null, data.purchasedBy || null, data.invoiceNumber || null, now(), now()
    );
    return this.findById(id);
  },
  findById(id) {
    const row = getDb().prepare(`
      SELECT p.*, s.name as supplier_name_rel, s.phone as supplier_phone,
             u.name as purchaser_name, u.role as purchaser_role
      FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.purchased_by = u.id WHERE p.id = ?`).get(id);
    return this._format(row);
  },
  _format(row) {
    if (!row) return null;
    const r = parseRow(row, ['items']);
    if (r.supplier_id) r.supplier = { _id: r.supplier_id, id: r.supplier_id, name: r.supplier_name_rel || r.supplier_name, phone: r.supplier_phone };
    if (r.purchased_by) r.purchasedBy = { _id: r.purchased_by, id: r.purchased_by, name: r.purchaser_name, role: r.purchaser_role };
    r.purchaseId = r.purchase_id;
    r.purchaseDate = r.purchase_date;
    r.taxAmount = r.tax_amount;
    r.totalAmount = r.total_amount;
    r.supplierName = r.supplier_name;
    r.invoiceNumber = r.invoice_number;
    r.createdAt = r.created_at;
    r.updatedAt = r.updated_at;
    return r;
  },
  find({ status = '', search = '', supplierId = '', purchasedBy = '', page = 1, limit = 10 } = {}) {
    const db = getDb();
    let sql = `SELECT p.*, s.name as supplier_name_rel, s.phone as supplier_phone,
               u.name as purchaser_name, u.role as purchaser_role
               FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
               LEFT JOIN users u ON p.purchased_by = u.id WHERE 1=1`;
    const params = [];
    if (purchasedBy) { sql += ' AND p.purchased_by = ?'; params.push(purchasedBy); }
    if (status) { sql += ' AND p.status = ?'; params.push(status); }
    if (search) { sql += ' AND p.purchase_id LIKE ?'; params.push(`%${search}%`); }
    if (supplierId) { sql += ' AND p.supplier_id = ?'; params.push(supplierId); }
    const total = db.prepare(sql.replace(/SELECT p\.\*.*FROM purchases/, 'SELECT COUNT(*) as c FROM purchases')).get(...params).c;
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    return { rows: db.prepare(sql).all(...params).map(r => this._format(r)), total };
  },
  findAll({ createdAt_gte } = {}) {
    let sql = `SELECT p.*, s.name as supplier_name_rel, u.name as purchaser_name
               FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
               LEFT JOIN users u ON p.purchased_by = u.id WHERE 1=1`;
    const params = [];
    if (createdAt_gte) { sql += ' AND p.created_at >= ?'; params.push(createdAt_gte); }
    sql += ' ORDER BY p.created_at DESC';
    return getDb().prepare(sql).all(...params).map(r => this._format(r));
  },
  aggregate_total(where = {}) {
    let sql = 'SELECT COALESCE(SUM(total_amount),0) as total FROM purchases WHERE 1=1';
    const params = [];
    if (where.createdAt_gte) { sql += ' AND created_at >= ?'; params.push(where.createdAt_gte); }
    return getDb().prepare(sql).get(...params).total;
  },
  update(id, data) {
    const db = getDb();
    const colMap = {
      status: 'status', notes: 'notes', receivedDate: 'received_date',
      invoiceNumber: 'invoice_number',
    };
    const sets = [];
    const vals = [];
    for (const [k, col] of Object.entries(colMap)) {
      if (data[k] !== undefined) { sets.push(`${col} = ?`); vals.push(data[k]); }
    }
    if (!sets.length) return this.findById(id);
    db.prepare(`UPDATE purchases SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, now(), id);
    return this.findById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM purchases WHERE id = ?').run(id);
  },
};

// ── ACTIVITY LOG ───────────────────────────────────────────────────────────
const ActivityLog = {
  create(data) {
    const db = getDb();
    const id = genId();
    db.prepare(`INSERT INTO activity_logs (id,user_id,user_name,user_role,action,module,description,details,ip_address,user_agent,severity,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, data.userId || null, data.userName || 'System', data.userRole || 'system',
      data.action, data.module, data.description, j(data.details),
      data.ipAddress || 'unknown', data.userAgent || 'system', data.severity || 'low', now()
    );
    return id;
  },
  find({ module: mod = '', action = '', page = 1, limit = 20 } = {}) {
    const db = getDb();
    let sql = `SELECT a.*, u.name as user_name_rel, u.role as user_role_rel
               FROM activity_logs a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1`;
    const params = [];
    if (mod) { sql += ' AND a.module = ?'; params.push(mod); }
    if (action) { sql += ' AND a.action = ?'; params.push(action); }
    const total = db.prepare(sql.replace(/SELECT a\.\*.*FROM activity_logs/, 'SELECT COUNT(*) as c FROM activity_logs')).get(...params).c;
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const rows = db.prepare(sql).all(...params).map(r => {
      const parsed = parseRow(r, ['details']);
      parsed.user = parsed.user_id ? { _id: parsed.user_id, name: parsed.user_name_rel, role: parsed.user_role_rel } : null;
      return parsed;
    });
    return { rows, total };
  },
  findRecent(limit = 10) {
    return getDb().prepare(`SELECT a.*, u.name as user_name_rel, u.role as user_role_rel
      FROM activity_logs a LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT ?`).all(limit).map(r => {
        const parsed = parseRow(r, ['details']);
        parsed.user = parsed.user_id ? { _id: parsed.user_id, name: parsed.user_name_rel, role: parsed.user_role_rel } : null;
        return parsed;
      });
  },
};

// ── PASSWORD RESET REQUEST ─────────────────────────────────────────────────
const PasswordResetRequest = {
  create(data) {
    const db = getDb();
    const id = genId();
    db.prepare(`INSERT INTO password_reset_requests (id,user_id,user_name,user_email,user_role,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(id, data.user, data.userName, data.userEmail, data.userRole, 'pending', now(), now());
    return this.findById(id);
  },
  findById(id) {
    return parseRow(getDb().prepare('SELECT * FROM password_reset_requests WHERE id = ?').get(id));
  },
  findOne(where) {
    const db = getDb();
    if (where.resetToken && where.status) {
      return parseRow(db.prepare('SELECT * FROM password_reset_requests WHERE reset_token = ? AND status = ?').get(where.resetToken, where.status));
    }
    if (where.userId && where.status) {
      return parseRow(db.prepare('SELECT * FROM password_reset_requests WHERE user_id = ? AND status = ?').get(where.userId, where.status));
    }
    return null;
  },
  find({ status = '' } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM password_reset_requests WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params).map(r => {
      const row = parseRow(r);
      row.userName = row.user_name;
      row.userEmail = row.user_email;
      row.userRole = row.user_role;
      row.resetToken = row.reset_token;
      row.resetTokenExpiry = row.reset_token_expiry;
      row.approvedBy = row.approved_by;
      row.adminNote = row.admin_note;
      row.resolvedAt = row.resolved_at;
      row.requestedAt = row.created_at;
      return row;
    });
  },
  update(id, fields) {
    const db = getDb();
    const colMap = {
      status: 'status', resetToken: 'reset_token', resetTokenExpiry: 'reset_token_expiry',
      approvedBy: 'approved_by', adminNote: 'admin_note', resolvedAt: 'resolved_at',
    };
    const sets = [];
    const vals = [];
    for (const [k, col] of Object.entries(colMap)) {
      if (fields[k] !== undefined) { sets.push(`${col} = ?`); vals.push(fields[k] ?? null); }
    }
    if (!sets.length) return this.findById(id);
    db.prepare(`UPDATE password_reset_requests SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals, now(), id);
    return this.findById(id);
  },
};

module.exports = { User, Supplier, Product, Order, Bill, Purchase, ActivityLog, PasswordResetRequest };
