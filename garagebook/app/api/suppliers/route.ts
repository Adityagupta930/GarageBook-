import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = db as any;

export async function GET() {
  try {
    const { data, error } = await q.from('suppliers').select('*').order('name');
    if (error) throw error;
    return apiOk(data);
  } catch (e) {
    console.error('[GET /api/suppliers]', e);
    return apiError('Suppliers load nahi hue', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address, company, note } = await req.json();
    if (!name?.trim()) return apiError('Supplier naam zaroori hai');
    const { data, error } = await q.from('suppliers').insert({
      name: name.trim(), phone: phone?.trim() || '',
      address: address?.trim() || '', company: company?.trim() || '',
      note: note?.trim() || '',
    }).select().single();
    if (error) throw error;
    return apiOk({ id: data.id }, 201);
  } catch (e) {
    console.error('[POST /api/suppliers]', e);
    return apiError('Supplier add nahi hua', 500);
  }
}
