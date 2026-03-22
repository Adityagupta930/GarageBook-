const express = require('express');
const cors    = require('cors');
const db      = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── INVENTORY ────────────────────────────────────────────────────

app.get('/api/inventory', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM inventory ORDER BY name';
  let rows;
  if (search) {
    rows = db.prepare('SELECT * FROM inventory WHERE LOWER(name) LIKE ? ORDER BY name').all(`%${search.toLowerCase()}%`);
  } else {
    rows = db.prepare(query).all();
  }
  res.json(rows);
});

app.post('/api/inventory', (req, res) => {
  const { name, stock, price, buy_price } = req.body;
  if (!name || stock == null || price == null || buy_price == null)
    return res.status(400).json({ error: 'name, stock, price, buy_price required' });
  const exists = db.prepare('SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)').get(name);
  if (exists) return res.status(409).json({ error: 'Part already exists' });
  const result = db.prepare('INSERT INTO inventory (name, stock, price, buy_price) VALUES (?, ?, ?, ?)').run(name, stock, price, buy_price);
  res.status(201).json({ id: result.lastInsertRowid, name, stock, price, buy_price });
});

app.put('/api/inventory/:id', (req, res) => {
  const { stock, price, buy_price } = req.body;
  if (stock == null || price == null) return res.status(400).json({ error: 'stock and price required' });
  db.prepare('UPDATE inventory SET stock = ?, price = ?, buy_price = ? WHERE id = ?').run(stock, price, buy_price ?? 0, req.params.id);
  res.json({ success: true });
});

// Add stock (when new stock arrives)
app.put('/api/inventory/:id/addstock', (req, res) => {
  const { qty } = req.body;
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Valid qty required' });
  db.prepare('UPDATE inventory SET stock = stock + ? WHERE id = ?').run(qty, req.params.id);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  res.json(item);
});

app.delete('/api/inventory/:id', (req, res) => {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Low stock items
app.get('/api/inventory/lowstock', (req, res) => {
  const threshold = req.query.threshold || 3;
  res.json(db.prepare('SELECT * FROM inventory WHERE stock <= ? ORDER BY stock ASC').all(threshold));
});

// ── CUSTOMERS ────────────────────────────────────────────────────

app.get('/api/customers', (req, res) => {
  res.json(db.prepare('SELECT * FROM customers ORDER BY name').all());
});

app.post('/api/customers', (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name required' });
  const exists = db.prepare('SELECT id FROM customers WHERE name = ? AND phone = ?').get(name, phone || '');
  if (exists) return res.status(409).json({ error: 'Customer already exists' });
  const result = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)').run(name, phone || '', address || '');
  res.status(201).json({ id: result.lastInsertRowid, name, phone, address });
});

app.delete('/api/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Customer credit history
app.get('/api/customers/:name/history', (req, res) => {
  const sales = db.prepare(`SELECT * FROM sales WHERE customer = ? ORDER BY date DESC`).all(req.params.name);
  res.json(sales);
});

// ── SALES ────────────────────────────────────────────────────────

app.get('/api/sales', (req, res) => {
  const { from, to, payment } = req.query;
  let query = 'SELECT * FROM sales WHERE 1=1';
  const params = [];
  if (from)    { query += ' AND date >= ?'; params.push(from); }
  if (to)      { query += ' AND date <= ?'; params.push(to + ' 23:59:59'); }
  if (payment) { query += ' AND payment = ?'; params.push(payment); }
  query += ' ORDER BY date DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/sales', (req, res) => {
  const { item_id, item_name, qty, amount, payment, customer, phone } = req.body;
  if (!item_name || !qty || !amount || !payment)
    return res.status(400).json({ error: 'item_name, qty, amount, payment required' });
  if (payment === 'udhaar' && !customer)
    return res.status(400).json({ error: 'Customer name required for credit' });

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Part not found' });
  if (item.stock < qty) return res.status(400).json({ error: `Only ${item.stock} in stock` });

  db.prepare('UPDATE inventory SET stock = stock - ? WHERE id = ?').run(qty, item_id);

  const result = db.prepare(
    `INSERT INTO sales (item_id, item_name, qty, amount, buy_price, payment, customer, phone, udhaar_paid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(item_id, item_name, qty, amount, item.buy_price, payment, customer || 'Walk-in', phone || '', payment !== 'udhaar' ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/sales/:id/paid', (req, res) => {
  db.prepare('UPDATE sales SET udhaar_paid = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── RETURNS ──────────────────────────────────────────────────────

app.get('/api/returns', (req, res) => {
  res.json(db.prepare('SELECT * FROM returns ORDER BY date DESC').all());
});

app.post('/api/returns', (req, res) => {
  const { sale_id, item_id, item_name, qty, amount, reason } = req.body;
  if (!item_name || !qty || !amount) return res.status(400).json({ error: 'item_name, qty, amount required' });

  // restore stock
  if (item_id) db.prepare('UPDATE inventory SET stock = stock + ? WHERE id = ?').run(qty, item_id);

  const result = db.prepare(
    'INSERT INTO returns (sale_id, item_id, item_name, qty, amount, reason) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(sale_id || null, item_id || null, item_name, qty, amount, reason || '');

  res.status(201).json({ id: result.lastInsertRowid });
});

// ── REPORTS ──────────────────────────────────────────────────────

app.get('/api/reports/summary', (req, res) => {
  const { from, to } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND date >= ?'; params.push(from); }
  if (to)   { where += ' AND date <= ?'; params.push(to + ' 23:59:59'); }

  const sales       = db.prepare(`SELECT * FROM sales ${where}`).all(...params);
  const totalSales  = sales.reduce((s, r) => s + r.amount, 0);
  const cashSales   = sales.filter(r => r.payment === 'cash').reduce((s, r) => s + r.amount, 0);
  const onlineSales = sales.filter(r => r.payment === 'online').reduce((s, r) => s + r.amount, 0);
  const creditSales = sales.filter(r => r.payment === 'udhaar').reduce((s, r) => s + r.amount, 0);
  const profit      = sales.reduce((s, r) => s + ((r.amount / r.qty) - r.buy_price) * r.qty, 0);
  const totalItems  = sales.reduce((s, r) => s + r.qty, 0);

  const pendingCredit = db.prepare('SELECT SUM(amount) as total FROM sales WHERE payment = "udhaar" AND udhaar_paid = 0').get();

  res.json({ totalSales, cashSales, onlineSales, creditSales, profit, totalItems, pendingCredit: pendingCredit.total || 0 });
});

// Daily breakdown
app.get('/api/reports/daily', (req, res) => {
  const { from, to } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND date >= ?'; params.push(from); }
  if (to)   { where += ' AND date <= ?'; params.push(to + ' 23:59:59'); }

  const rows = db.prepare(`
    SELECT DATE(date) as day,
      SUM(amount) as total,
      SUM(CASE WHEN payment != 'udhaar' THEN amount ELSE 0 END) as earned,
      SUM((amount/qty - buy_price) * qty) as profit,
      COUNT(*) as count
    FROM sales ${where}
    GROUP BY DATE(date)
    ORDER BY day DESC
  `).all(...params);
  res.json(rows);
});

// Top selling parts
app.get('/api/reports/topparts', (req, res) => {
  res.json(db.prepare(`
    SELECT item_name, SUM(qty) as total_qty, SUM(amount) as total_amount
    FROM sales GROUP BY item_name ORDER BY total_qty DESC LIMIT 10
  `).all());
});

// ── START ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ GarageBook backend running → http://localhost:${PORT}`));
