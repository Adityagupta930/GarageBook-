import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const billRes = await db.execute({ sql: 'SELECT * FROM bills WHERE id = ?', args: [id] });
    if (!billRes.rows.length) return apiError('Bill nahi mila', 404);

    const itemsRes = await db.execute({ sql: 'SELECT * FROM bill_items WHERE bill_id = ?', args: [id] });
    return apiOk({ ...billRes.rows[0], items: itemsRes.rows });
  } catch (e) {
    console.error('[GET /api/bills/:id]', e);
    return apiError('Bill fetch nahi hua', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const info = await db.execute({ sql: 'DELETE FROM bills WHERE id = ?', args: [id] });
    if (info.rowsAffected === 0) return apiError('Bill nahi mila', 404);
    return apiOk({ success: true });
  } catch (e) {
    console.error('[DELETE /api/bills/:id]', e);
    return apiError('Bill delete nahi hua', 500);
  }
}
