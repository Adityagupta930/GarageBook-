import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search');
  const rows = search
    ? db.prepare('SELECT * FROM inventory WHERE LOWER(name) LIKE ? ORDER BY name').all(`%${search.toLowerCase()}%`)
    : db.prepare('SELECT * FROM inventory ORDER BY name').all();
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, stock, price, buy_price } = await req.json();
  if (!name || stock == null || price == null || buy_price == null)
    return apiError('name, stock, price, buy_price required');
  const exists = db.prepare('SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)').get(name);
  if (exists) return apiError('Part already exists', 409);
  const result = db.prepare(
    'INSERT INTO inventory (name, stock, price, buy_price) VALUES (?, ?, ?, ?)'
  ).run(name, stock, price, buy_price);
  return Response.json({ id: result.lastInsertRowid, name, stock, price, buy_price }, { status: 201 });
}
