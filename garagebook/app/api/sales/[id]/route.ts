import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'paid') {
      const info = await db.execute({ sql: 'UPDATE sales SET udhaar_paid = 1 WHERE id = ?', args: [id] });
      if (info.rowsAffected === 0) return apiError('Sale nahi mili', 404);
      return apiOk({ success: true });
    }

    // Full edit
    const { item_name, qty, amount, payment, customer, phone, date } = body;
    if (!item_name?.trim())                          return apiError('Item naam zaroori');
    if (!qty || isNaN(+qty) || +qty <= 0)            return apiError('Valid qty daalo');
    if (amount == null || isNaN(+amount))            return apiError('Valid amount daalo');
    if (!['cash','online','udhaar'].includes(payment)) return apiError('Payment type galat');
    if (payment === 'udhaar' && !customer?.trim())   return apiError('Credit ke liye customer naam zaroori');

    const info = await db.execute({
      sql: `UPDATE sales SET item_name=?, qty=?, amount=?, payment=?, customer=?, phone=?,
            udhaar_paid=?, ${date ? 'date=?,' : ''} id=id WHERE id=?`,
      args: date
        ? [item_name.trim(), +qty, +amount, payment, customer?.trim()||'Walk-in', phone?.trim()||'', payment!=='udhaar'?1:0, date, id]
        : [item_name.trim(), +qty, +amount, payment, customer?.trim()||'Walk-in', phone?.trim()||'', payment!=='udhaar'?1:0, id],
    });
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
