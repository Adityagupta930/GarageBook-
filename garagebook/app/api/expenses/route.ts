import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiError, apiOk } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const args: string[] = [];
    if (from) { sql += ' AND date >= ?'; args.push(from); }
    if (to)   { sql += ' AND date <= ?'; args.push(to + ' 23:59:59'); }
    sql += ' ORDER BY date DESC';
    const r = await db.execute({ sql, args });
    return apiOk(r.rows);
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
    const r = await db.execute({
      sql: 'INSERT INTO expenses (title, amount, category, note, date) VALUES (?, ?, ?, ?, ?)',
      args: [title.trim(), +amount, category?.trim() || 'Other', note?.trim() || '', date || new Date().toISOString().slice(0, 19).replace('T', ' ')],
    });
    return apiOk({ id: Number(r.lastInsertRowid) }, 201);
  } catch (e) {
    console.error('[POST /api/expenses]', e);
    return apiError('Expense add nahi hua', 500);
  }
}
