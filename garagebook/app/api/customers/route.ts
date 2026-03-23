import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError } from '@/lib/utils';

export async function GET() {
  return Response.json(db.prepare('SELECT * FROM customers ORDER BY name').all());
}

export async function POST(req: NextRequest) {
  const { name, phone, address } = await req.json();
  if (!name) return apiError('Customer name required');
  const exists = db.prepare('SELECT id FROM customers WHERE name = ? AND phone = ?').get(name, phone || '');
  if (exists) return apiError('Customer already exists', 409);
  const result = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)')
    .run(name, phone || '', address || '');
  return Response.json({ id: result.lastInsertRowid, name, phone, address }, { status: 201 });
}
