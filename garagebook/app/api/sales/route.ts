import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const payment = searchParams.get('payment');

  let query = 'SELECT * FROM sales WHERE 1=1';
  const params: string[] = [];
  if (from)    { query += ' AND date >= ?'; params.push(from); }
  if (to)      { query += ' AND date <= ?'; params.push(to + ' 23:59:59'); }
  if (payment) { query += ' AND payment = ?'; params.push(payment); }
  query += ' ORDER BY date DESC';

  return Response.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  const { item_id, item_name, qty, amount, payment, customer, phone } = await req.json();
  if (!item_name || !qty || !amount || !payment)
    return apiError('item_name, qty, amount, payment required');
  if (payment === 'udhaar' && !customer)
    return apiError('Customer name required for credit');

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item_id) as { stock: number; buy_price: number } | undefined;
  if (!item) return apiError('Part not found', 404);
  if (item.stock < qty) return apiError(`Only ${item.stock} in stock`);

  db.prepare('UPDATE inventory SET stock = stock - ? WHERE id = ?').run(qty, item_id);
  const result = db.prepare(
    `INSERT INTO sales (item_id, item_name, qty, amount, buy_price, payment, customer, phone, udhaar_paid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(item_id, item_name, qty, amount, item.buy_price, payment, customer || 'Walk-in', phone || '', payment !== 'udhaar' ? 1 : 0);

  return Response.json({ id: result.lastInsertRowid }, { status: 201 });
}
