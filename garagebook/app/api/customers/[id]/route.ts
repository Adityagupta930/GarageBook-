import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = db as any;

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await q.from('customers').delete().eq('id', id);
    if (error) throw error;
    return apiOk({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/customers/[id]]', e);
    return apiError('Delete nahi hua', 500);
  }
}
