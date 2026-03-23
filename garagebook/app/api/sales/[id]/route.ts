import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { action } = await req.json();
    if (action !== 'paid') return apiError('Unknown action');
    const info = await db.execute({ sql: 'UPDATE sales SET udhaar_paid = 1 WHERE id = ?', args: [id] });
    if (info.rowsAffected === 0) return apiError('Sale nahi mili', 404);
    return apiOk({ success: true });
  } catch (e) {
    console.error('[PUT /api/sales/:id]', e);
    return apiError('Update karne mein error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.execute({ sql: 'DELETE FROM sales WHERE id = ?', args: [id] });
    return apiOk({ success: true });
  } catch (e) {
    console.error('[DELETE /api/sales/:id]', e);
    return apiError('Delete karne mein error', 500);
  }
}
