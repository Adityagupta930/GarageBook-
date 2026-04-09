import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, phone, address, company, note } = await req.json();
    if (!name?.trim()) return apiError('Naam zaroori hai');
    const { error } = await db.from('suppliers').update({
      name: name.trim(), phone: phone?.trim() || '',
      address: address?.trim() || '', company: company?.trim() || '',
      note: note?.trim() || '',
    }).eq('id', id);
    if (error) throw error;
    return apiOk({ ok: true });
  } catch (e) {
    console.error('[PUT /api/suppliers/[id]]', e);
    return apiError('Update nahi hua', 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await db.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return apiOk({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/suppliers/[id]]', e);
    return apiError('Delete nahi hua', 500);
  }
}
