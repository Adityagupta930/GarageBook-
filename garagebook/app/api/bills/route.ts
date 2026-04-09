import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

function genBillNo(): string {
  const now = new Date();
  const d = now.toLocaleDateString('en-CA').replace(/-/g, '');
  const t = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `PA-${d}-${t}${r}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from  = searchParams.get('from');
    const to    = searchParams.get('to');
    const limit = +(searchParams.get('limit') || 200);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = db.from('bills').select('*') as any;
    if (from) query = query.gte('date', from);
    if (to)   query = query.lte('date', to + 'T23:59:59');
    query = query.order('date', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return apiOk(data);
  } catch (e) {
    console.error('[GET /api/bills]', e);
    return apiError('Bills fetch nahi hue', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customer, phone, payment, subtotal, discount, total, operator, notes, items } = await req.json();

    if (!items?.length) return apiError('Bill mein koi item nahi');
    if (!['cash', 'online', 'udhaar'].includes(payment)) return apiError('Payment type galat');
    if (payment === 'udhaar' && !customer?.trim()) return apiError('Credit ke liye customer naam zaroori');

    // Validate stock
    for (const item of items) {
      const { data: inv } = await db.from('inventory').select('stock').eq('id', item.item_id).single() as { data: { stock: number } | null; error: unknown };
      if (!inv) return apiError(`Part nahi mila: ${item.item_name}`);
      if (inv.stock < item.qty) return apiError(`${item.item_name} — sirf ${inv.stock} stock bacha hai`);
    }

    const bill_no  = genBillNo();
    const custName = customer?.trim() || 'Walk-in';

    const { data: bill, error: billErr } = await db.from('bills').insert({
      bill_no, customer: custName, phone: phone?.trim() || '', payment,
      subtotal: +subtotal, discount: +discount, total: +total,
      operator: operator?.trim() || '', notes: notes?.trim() || '',
    }).select().single() as { data: { id: number } | null; error: unknown };
    if (billErr || !bill) throw billErr;

    for (const item of items) {
      const { data: inv } = await db.from('inventory').select('stock,buy_price').eq('id', item.item_id).single() as { data: { stock: number; buy_price: number } | null; error: unknown };
      const buy_price = Number(inv?.buy_price || 0);
      const curStock  = Number(inv?.stock || 0);

      await db.from('bill_items').insert({
        bill_id: bill.id, item_id: item.item_id, item_name: item.item_name,
        qty: item.qty, price: item.price, buy_price, amount: item.amount,
      });
      await db.from('inventory').update({ stock: curStock - item.qty }).eq('id', item.item_id);
      await db.from('sales').insert({
        item_id: item.item_id, item_name: item.item_name,
        qty: item.qty, amount: item.amount, buy_price, payment,
        customer: custName, phone: phone?.trim() || '',
        udhaar_paid: payment !== 'udhaar',
        notes: `Bill #${bill_no}`,
      });
    }

    return apiOk({ id: bill.id, bill_no }, 201);
  } catch (e) {
    console.error('[POST /api/bills]', e);
    return apiError('Bill save nahi hua', 500);
  }
}
