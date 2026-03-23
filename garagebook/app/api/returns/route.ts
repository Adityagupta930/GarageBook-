import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET() {
  try {
    return apiOk(db.prepare('SELECT * FROM returns ORDER BY date DESC').all());
  } catch (e) {
    console.error('[GET /api/returns]', e);
    return apiError('Returns fetch karne mein error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sale_id, item_id, item_name, qty, amount, reason } = await req.json();
    if (!item_name?.trim()) return apiError('Item naam zaroori hai');
    if (!qty || isNaN(+qty) || +qty <= 0) return apiError('Valid qty daalo');
    if (!amount || isNaN(+amount)) return apiError('Valid amount daalo');

    const doReturn = db.transaction(() => {
      if (item_id) db.prepare('UPDATE inventory SET stock = stock + ? WHERE id = ?').run(+qty, item_id);
      return db.prepare(
        'INSERT INTO returns (sale_id, item_id, item_name, qty, amount, reason) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(sale_id ?? null, item_id ?? null, item_name.trim(), +qty, +amount, reason?.trim() || '');
    });

    const result = doReturn();
    return apiOk({ id: result.lastInsertRowid }, 201);
  } catch (e) {
    console.error('[POST /api/returns]', e);
    return apiError('Return darj karne mein error', 500);
  }
}
