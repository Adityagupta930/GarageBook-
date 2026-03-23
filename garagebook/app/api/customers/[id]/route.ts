import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    return apiOk({ success: true });
  } catch (e) {
    console.error('[DELETE /api/customers/:id]', e);
    return apiError('Delete karne mein error', 500);
  }
}
