import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = db as any;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    let query = q.from('expenses').select('*');
    if (from) query = query.gte('date', from);
    if (to)   query = query.lte('date', to + 'T23:59:59');
    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return apiOk(data);
  } catch (e) {
    console.error('[GET /api/expenses]', e);
    return apiError('Expenses load nahi hue', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, amount, category, note, date } = await req.json();
    if (!title?.trim()) return apiError('Title zaroori hai');
    if (!amount || +amount <= 0) return apiError('Valid amount daalo');

    const { data, error } = await q.from('expenses').insert({
      title: title.trim(), amount: +amount,
      category: category?.trim() || 'Other',
      note: note?.trim() || '',
      ...(date ? { date } : {}),
    }).select().single();
    if (error) throw error;
    return apiOk({ id: data.id }, 201);
  } catch (e) {
    console.error('[POST /api/expenses]', e);
    return apiError('Expense add nahi hua', 500);
  }
}
