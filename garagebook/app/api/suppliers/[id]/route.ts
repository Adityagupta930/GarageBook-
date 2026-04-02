import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, phone, address, company, note } = await req.json();
    if (!name?.trim()) return apiError('Naam zaroori hai');
    await db.execute({
      sql: 'UPDATE suppliers SET name=?, phone=?, address=?, company=?, note=? WHERE id=?',
      args: [name.trim(), phone?.trim() || '', address?.trim() || '', company?.trim() || '', note?.trim() || '', +id],
    });
    return apiOk({ ok: true });
  } catch (e) {
    console.error('[PUT /api/suppliers/[id]]', e);
    return apiError('Update nahi hua', 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.execute({ sql: 'DELETE FROM suppliers WHERE id = ?', args: [+id] });
    return apiOk({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/suppliers/[id]]', e);
    return apiError('Delete nahi hua', 500);
  }
}
