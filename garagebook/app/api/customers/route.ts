import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET() {
  try {
    return apiOk(db.prepare('SELECT * FROM customers ORDER BY name').all());
  } catch (e) {
    console.error('[GET /api/customers]', e);
    return apiError('Customers fetch karne mein error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address } = await req.json();
    if (!name?.trim()) return apiError('Customer naam zaroori hai');
    const exists = db.prepare('SELECT id FROM customers WHERE name = ? AND phone = ?').get(name.trim(), phone || '');
    if (exists) return apiError('Customer pehle se exist karta hai', 409);
    const result = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)')
      .run(name.trim(), phone?.trim() || '', address?.trim() || '');
    return apiOk({ id: result.lastInsertRowid, name: name.trim(), phone, address }, 201);
  } catch (e) {
    console.error('[POST /api/customers]', e);
    return apiError('Customer add karne mein error', 500);
  }
}
