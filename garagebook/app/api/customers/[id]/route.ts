import { NextRequest } from 'next/server';
import db from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return Response.json({ success: true });
}
