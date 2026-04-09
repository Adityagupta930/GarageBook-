import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = db as any;
type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'paid') {
      const { error } = await q.from('sales').update({ udhaar_paid: true }).eq('id', id);
      if (error) throw error;
      return apiOk({ success: true });
    }

    const { item_name, qty, amount, payment, customer, phone, date } = body;
    if (!item_name?.trim()) return apiError('Item naam zaroori');
    if (!qty || isNaN(+qty) || +qty <= 0) return apiError('Valid qty daalo');
    if (amount == null || isNaN(+amount)) return apiError('Valid amount daalo');
    if (!['cash', 'online', 'udhaar'].includes(payment)) return apiError('Payment type galat');
    if (payment === 'udhaar' && !customer?.trim()) return apiError('Credit ke liye customer naam zaroori');

    const updates: Record<string, unknown> = {
      item_name: item_name.trim(), qty: +qty, amount: +amount,
      payment, customer: customer?.trim() || 'Walk-in',
      phone: phone?.trim() || '',
      udhaar_paid: payment !== 'udhaar',
    };
    if (date) updates.date = date;

    const { error } = await q.from('sales').update(updates).eq('id', id);
    if (error) throw error;
    return apiOk({ success: true });
  } catch (e) {
    console.error('[PUT /api/sales/:id]', e);
    return apiError('Update karne mein error', 500);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await q.from('sales').delete().eq('id', id);
    if (error) throw error;
    return apiOk({ success: true });
  } catch (e) {
    console.error('[DELETE /api/sales/:id]', e);
    return apiError('Delete karne mein error', 500);
  }
}
