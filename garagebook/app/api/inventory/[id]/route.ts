import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  // addstock action
  if (body.action === 'addstock') {
    const qty = Number(body.qty);
    if (!qty || qty <= 0) return apiError('Valid qty required');
    db.prepare('UPDATE inventory SET stock = stock + ? WHERE id = ?').run(qty, id);
    return Response.json(db.prepare('SELECT * FROM inventory WHERE id = ?').get(id));
  }

  const { stock, price, buy_price } = body;
  if (stock == null || price == null) return apiError('stock and price required');
  db.prepare('UPDATE inventory SET stock = ?, price = ?, buy_price = ? WHERE id = ?')
    .run(stock, price, buy_price ?? 0, id);
  return Response.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
  return Response.json({ success: true });
}
