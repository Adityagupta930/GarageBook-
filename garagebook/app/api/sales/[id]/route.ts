import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  if (body.action === 'paid') {
    db.prepare('UPDATE sales SET udhaar_paid = 1 WHERE id = ?').run(id);
    return Response.json({ success: true });
  }
  return apiError('Unknown action');
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  db.prepare('DELETE FROM sales WHERE id = ?').run(id);
  return Response.json({ success: true });
}
