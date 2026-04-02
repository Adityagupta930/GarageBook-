import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET() {
  try {
    const r = await db.execute('SELECT * FROM suppliers ORDER BY name');
    return apiOk(r.rows);
  } catch (e) {
    console.error('[GET /api/suppliers]', e);
    return apiError('Suppliers load nahi hue', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address, company, note } = await req.json();
    if (!name?.trim()) return apiError('Supplier naam zaroori hai');
    const r = await db.execute({
      sql: 'INSERT INTO suppliers (name, phone, address, company, note) VALUES (?, ?, ?, ?, ?)',
      args: [name.trim(), phone?.trim() || '', address?.trim() || '', company?.trim() || '', note?.trim() || ''],
    });
    return apiOk({ id: Number(r.lastInsertRowid) }, 201);
  } catch (e) {
    console.error('[POST /api/suppliers]', e);
    return apiError('Supplier add nahi hua', 500);
  }
}
