'use client';
// Mobile (Capacitor) app mein yeh file use hoti hai
// API routes bypass karke Supabase se directly baat karta hai

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const mobileDb = createClient(url, key);

// ── Inventory ────────────────────────────────────────────────────
export async function getInventory(search?: string, category?: string, instock?: boolean) {
  let q = mobileDb.from('inventory').select('*');
  if (search)   q = q.ilike('name', `%${search}%`);
  if (category) q = q.eq('category', category);
  if (instock)  q = q.gt('stock', 0);
  const { data } = await q.order('name');
  return data ?? [];
}

export async function addInventoryItem(item: {
  name: string; sku: string; category: string;
  stock: number; price: number; buy_price: number; company: string;
}) {
  const { data, error } = await mobileDb.from('inventory').insert(item).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateInventoryItem(id: number, updates: Record<string, unknown>) {
  const { error } = await mobileDb.from('inventory').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteInventoryItem(id: number) {
  const { error } = await mobileDb.from('inventory').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Sales ────────────────────────────────────────────────────────
export async function getSales(opts?: { from?: string; to?: string; payment?: string; limit?: number }) {
  let q = mobileDb.from('sales').select('*');
  if (opts?.from)    q = q.gte('date', opts.from);
  if (opts?.to)      q = q.lte('date', opts.to + 'T23:59:59');
  if (opts?.payment) q = q.eq('payment', opts.payment);
  const { data } = await q.order('date', { ascending: false }).limit(opts?.limit ?? 200);
  return data ?? [];
}

// ── Bills ────────────────────────────────────────────────────────
function genBillNo(): string {
  const now = new Date();
  const d = now.toLocaleDateString('en-CA').replace(/-/g, '');
  const t = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `PA-${d}-${t}${r}`;
}

export async function createBill(payload: {
  customer: string; phone: string; payment: string;
  subtotal: number; discount: number; total: number;
  operator: string; notes: string;
  items: { item_id: number; item_name: string; qty: number; price: number; amount: number }[];
}) {
  const bill_no  = genBillNo();
  const custName = payload.customer?.trim() || 'Walk-in';

  const { data: bill, error: billErr } = await mobileDb.from('bills').insert({
    bill_no, customer: custName, phone: payload.phone?.trim() || '',
    payment: payload.payment, subtotal: payload.subtotal,
    discount: payload.discount, total: payload.total,
    operator: payload.operator?.trim() || '', notes: payload.notes?.trim() || '',
  }).select().single();
  if (billErr || !bill) throw new Error(billErr?.message ?? 'Bill save nahi hua');

  for (const item of payload.items) {
    const { data: inv } = await mobileDb.from('inventory')
      .select('stock,buy_price').eq('id', item.item_id).single();
    const buy_price = Number(inv?.buy_price ?? 0);
    const curStock  = Number(inv?.stock ?? 0);

    await mobileDb.from('bill_items').insert({
      bill_id: bill.id, item_id: item.item_id, item_name: item.item_name,
      qty: item.qty, price: item.price, buy_price, amount: item.amount,
    });
    await mobileDb.from('inventory').update({ stock: curStock - item.qty }).eq('id', item.item_id);
    await mobileDb.from('sales').insert({
      item_id: item.item_id, item_name: item.item_name,
      qty: item.qty, amount: item.amount, buy_price,
      payment: payload.payment, customer: custName,
      phone: payload.phone?.trim() || '',
      udhaar_paid: payload.payment !== 'udhaar',
      notes: `Bill #${bill_no}`,
    });
  }

  return { id: bill.id, bill_no };
}

// ── Customers ────────────────────────────────────────────────────
export async function getCustomers() {
  const { data } = await mobileDb.from('customers').select('*').order('name');
  return data ?? [];
}

// ── Credit (Udhaar) ──────────────────────────────────────────────
export async function markUdhaarPaid(saleId: number) {
  const { error } = await mobileDb.from('sales').update({ udhaar_paid: true }).eq('id', saleId);
  if (error) throw new Error(error.message);
}
