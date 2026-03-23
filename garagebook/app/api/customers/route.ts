import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM customers ORDER BY name');
    return apiOk(result.rows);
  } catch (e) {
    console.error('[GET /api/customers]', e);
    return apiError('Customers fetch karne mein error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address } = await req.json();
    if (!name?.trim()) return apiError('Customer naam zaroori hai');
    const exists = await db.execute({ sql: 'SELECT id FROM customers WHERE name = ? AND phone = ?', args: [name.trim(), phone || ''] });
    if (exists.rows.length) return apiError('Customer pehle se exist karta hai', 409);
    const result = await db.execute({ sql: 'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)', args: [name.trim(), phone?.trim() || '', address?.trim() || ''] });
    return apiOk({ id: Number(result.lastInsertRowid), name: name.trim(), phone, address }, 201);
  } catch (e) {
    console.error('[POST /api/customers]', e);
    return apiError('Customer add karne mein error', 500);
  }
}
