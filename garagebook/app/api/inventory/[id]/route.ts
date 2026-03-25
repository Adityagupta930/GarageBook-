import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'addstock') {
      const qty = Number(body.qty);
      if (!qty || qty <= 0) return apiError('Valid qty daalo');
      await db.execute({ sql: 'UPDATE inventory SET stock = stock + ? WHERE id = ?', args: [qty, id] });
      const r = await db.execute({ sql: 'SELECT * FROM inventory WHERE id = ?', args: [id] });
      return apiOk(r.rows[0]);
    }

    const { stock, price, buy_price, company, sku, category } = body;
    if (stock == null || isNaN(+stock)) return apiError('Valid stock daalo');

    const fields: string[] = ['stock = ?'];
    const args: (string | number)[] = [+stock];
    if (price     != null && !isNaN(+price))     { fields.push('price = ?');     args.push(+price); }
    if (buy_price != null && !isNaN(+buy_price)) { fields.push('buy_price = ?'); args.push(+buy_price); }
    if (company   != null) { fields.push('company = ?');  args.push(company.trim()); }
    if (sku       != null) { fields.push('sku = ?');      args.push(sku.trim()); }
    if (category  != null) { fields.push('category = ?'); args.push(category.trim()); }
    args.push(id);

    const info = await db.execute({ sql: `UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`, args });
    if (info.rowsAffected === 0) return apiError('Part nahi mila', 404);
    return apiOk({ success: true });
  } catch (e) {
    console.error('[PUT /api/inventory/:id]', e);
    return apiError('Update karne mein error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const info = await db.execute({ sql: 'DELETE FROM inventory WHERE id = ?', args: [id] });
    if (info.rowsAffected === 0) return apiError('Part nahi mila', 404);
    return apiOk({ success: true });
  } catch (e) {
    console.error('[DELETE /api/inventory/:id]', e);
    return apiError('Delete karne mein error', 500);
  }
}
