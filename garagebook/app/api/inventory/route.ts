import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search');
    const rows = search
      ? db.prepare('SELECT * FROM inventory WHERE LOWER(name) LIKE ? ORDER BY name').all(`%${search.toLowerCase()}%`)
      : db.prepare('SELECT * FROM inventory ORDER BY name').all();
    return apiOk(rows);
  } catch (e) {
    console.error('[GET /api/inventory]', e);
    return apiError('Failed to fetch inventory', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, stock, price, buy_price, company } = body;
    if (!name?.trim()) return apiError('Part naam zaroori hai');
    if (stock == null || isNaN(+stock) || +stock < 0) return apiError('Valid stock daalo');
    if (price == null || isNaN(+price) || +price < 0) return apiError('Valid selling price daalo');
    if (buy_price == null || isNaN(+buy_price) || +buy_price < 0) return apiError('Valid buy price daalo');

    const exists = db.prepare('SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (exists) return apiError('Ye part pehle se exist karta hai', 409);

    const result = db.prepare(
      'INSERT INTO inventory (name, stock, price, buy_price, company) VALUES (?, ?, ?, ?, ?)'
    ).run(name.trim(), +stock, +price, +buy_price, company?.trim() || '');

    return apiOk({ id: result.lastInsertRowid, name: name.trim(), stock: +stock, price: +price, buy_price: +buy_price, company: company?.trim() || '' }, 201);
  } catch (e) {
    console.error('[POST /api/inventory]', e);
    return apiError('Part add karne mein error', 500);
  }
}
