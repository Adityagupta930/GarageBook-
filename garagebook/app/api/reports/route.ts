import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type') || 'summary';
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    if (type === 'topparts') {
      const { data, error } = await db.from('sales').select('item_name, qty, amount');
      if (error) throw error;
      const counts: Record<string, { total_qty: number; total_amount: number }> = {};
      for (const s of data || []) {
        if (!counts[s.item_name]) counts[s.item_name] = { total_qty: 0, total_amount: 0 };
        counts[s.item_name].total_qty    += Number(s.qty);
        counts[s.item_name].total_amount += Number(s.amount);
      }
      const top = Object.entries(counts)
        .map(([item_name, v]) => ({ item_name, ...v }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 10);
      return apiOk(top);
    }

    if (type === 'daily') {
      let query = db.from('sales').select('date, amount, qty, buy_price, payment');
      if (from) query = query.gte('date', from);
      if (to)   query = query.lte('date', to + 'T23:59:59');
      const { data, error } = await query;
      if (error) throw error;

      const byDay: Record<string, { total: number; earned: number; profit: number; count: number }> = {};
      for (const s of data || []) {
        const day = String(s.date).slice(0, 10);
        if (!byDay[day]) byDay[day] = { total: 0, earned: 0, profit: 0, count: 0 };
        byDay[day].total  += Number(s.amount);
        byDay[day].count  += 1;
        if (s.payment !== 'udhaar') byDay[day].earned += Number(s.amount);
        byDay[day].profit += ((Number(s.amount) / Number(s.qty)) - Number(s.buy_price)) * Number(s.qty);
      }
      const daily = Object.entries(byDay)
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => b.day.localeCompare(a.day))
        .slice(0, 30);
      return apiOk(daily);
    }

    // Summary
    let query = db.from('sales').select('amount, qty, buy_price, payment, udhaar_paid');
    if (from) query = query.gte('date', from);
    if (to)   query = query.lte('date', to + 'T23:59:59');
    const { data: sales, error } = await query;
    if (error) throw error;

    const rows = sales || [];
    const totalSales  = rows.reduce((s, r) => s + Number(r.amount), 0);
    const cashSales   = rows.filter(r => r.payment === 'cash').reduce((s, r) => s + Number(r.amount), 0);
    const onlineSales = rows.filter(r => r.payment === 'online').reduce((s, r) => s + Number(r.amount), 0);
    const creditSales = rows.filter(r => r.payment === 'udhaar').reduce((s, r) => s + Number(r.amount), 0);
    const profit      = rows.reduce((s, r) => s + ((Number(r.amount) / Number(r.qty)) - Number(r.buy_price)) * Number(r.qty), 0);
    const totalItems  = rows.reduce((s, r) => s + Number(r.qty), 0);

    const { data: pending } = await db.from('sales').select('amount').eq('payment', 'udhaar').eq('udhaar_paid', false);
    const pendingCredit = (pending || []).reduce((s, r) => s + Number(r.amount), 0);

    return apiOk({ totalSales, cashSales, onlineSales, creditSales, profit, totalItems, pendingCredit });
  } catch (e) {
    console.error('[GET /api/reports]', e);
    return apiError('Reports fetch karne mein error', 500);
  }
}
