import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

function genBillNo(): string {
  const now = new Date();
  const d = now.toLocaleDateString('en-CA').replace(/-/g, '');
  const t = String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
  const r = String(Math.floor(Math.random() * 100)).padStart(2,'0');
  return `PA-${d}-${t}${r}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from    = searchParams.get('from');
    const to      = searchParams.get('to');
    const limit   = searchParams.get('limit') || '200';

    let sql = 'SELECT * FROM bills WHERE 1=1';
    const args: (string | number)[] = [];
    if (from) { sql += ' AND date >= ?'; args.push(from); }
    if (to)   { sql += ' AND date <= ?'; args.push(to + ' 23:59:59'); }
    sql += ` ORDER BY date DESC LIMIT ${+limit}`;

    const result = await db.execute({ sql, args });
    return apiOk(result.rows);
  } catch (e) {
    console.error('[GET /api/bills]', e);
    return apiError('Bills fetch nahi hue', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customer, phone, payment, subtotal, discount, total, operator, notes, items } = await req.json();

    if (!items?.length)                              return apiError('Bill mein koi item nahi');
    if (!['cash','online','udhaar'].includes(payment)) return apiError('Payment type galat');
    if (payment === 'udhaar' && !customer?.trim())   return apiError('Credit ke liye customer naam zaroori');

    // Validate stock for all items first
    for (const item of items) {
      const r = await db.execute({ sql: 'SELECT stock FROM inventory WHERE id = ?', args: [item.item_id] });
      if (!r.rows.length) return apiError(`Part nahi mila: ${item.item_name}`);
      const stock = Number((r.rows[0] as Record<string,unknown>).stock);
      if (stock < item.qty) return apiError(`${item.item_name} — sirf ${stock} stock bacha hai`);
    }

    const bill_no = genBillNo();
    const custName = customer?.trim() || 'Walk-in';

    // Insert bill
    const billRes = await db.execute({
      sql: `INSERT INTO bills (bill_no, customer, phone, payment, subtotal, discount, total, operator, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [bill_no, custName, phone?.trim() || '', payment,
             +subtotal, +discount, +total, operator?.trim() || '', notes?.trim() || ''],
    });
    const bill_id = Number(billRes.lastInsertRowid);

    // Insert items + deduct stock + insert sales records
    for (const item of items) {
      const invRow = await db.execute({ sql: 'SELECT buy_price FROM inventory WHERE id = ?', args: [item.item_id] });
      const buy_price = Number((invRow.rows[0] as Record<string,unknown>).buy_price || 0);

      await db.batch([
        // bill_items record
        {
          sql: `INSERT INTO bill_items (bill_id, item_id, item_name, qty, price, buy_price, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [bill_id, item.item_id, item.item_name, item.qty, item.price, buy_price, item.amount],
        },
        // deduct stock
        { sql: 'UPDATE inventory SET stock = stock - ? WHERE id = ?', args: [item.qty, item.item_id] },
        // sales record (for dashboard/history compatibility)
        {
          sql: `INSERT INTO sales (item_id, item_name, qty, amount, buy_price, payment, customer, phone, udhaar_paid, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [item.item_id, item.item_name, item.qty, item.amount, buy_price,
                 payment, custName, phone?.trim() || '',
                 payment !== 'udhaar' ? 1 : 0, `Bill #${bill_no}`],
        },
      ], 'write');
    }

    return apiOk({ id: bill_id, bill_no }, 201);
  } catch (e) {
    console.error('[POST /api/bills]', e);
    return apiError('Bill save nahi hua', 500);
  }
}
