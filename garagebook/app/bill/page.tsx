'use client';
import { useEffect, useState } from 'react';
import { toast } from '@/components/Toast';
import { fmtDate } from '@/lib/utils';
import type { InventoryItem } from '@/types';

interface BillItem { item_id: number; item_name: string; qty: number; price: number; }

const SHOP_KEY = 'gb_shop_name';

export default function BillPage() {
  const [inv, setInv]           = useState<InventoryItem[]>([]);
  const [items, setItems]       = useState<BillItem[]>([]);
  const [selId, setSelId]       = useState('');
  const [qty, setQty]           = useState('1');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone]       = useState('');
  const [payment, setPayment]   = useState<'cash' | 'online' | 'udhaar'>('cash');
  const [shopName, setShopName] = useState('GarageBook Auto Parts');
  const [saving, setSaving]     = useState(false);

  const loadInv = async () => {
    const data: InventoryItem[] = await fetch('/api/inventory').then(r => r.json());
    setInv(data);
    return data;
  };

  useEffect(() => {
    loadInv();
    // Restore saved shop name
    const saved = localStorage.getItem(SHOP_KEY);
    if (saved) setShopName(saved);
  }, []);

  function onShopNameChange(val: string) {
    setShopName(val);
    localStorage.setItem(SHOP_KEY, val);
  }

  function addItem() {
    const item = inv.find(i => i.id === +selId);
    if (!item) return toast('Part select karo!', 'error');
    if (!qty || +qty <= 0) return toast('Valid qty daalo!', 'error');
    if (+qty > item.stock) return toast(`Sirf ${item.stock} stock hai!`, 'error');
    setItems(p => {
      const ex = p.find(i => i.item_id === item.id);
      if (ex) return p.map(i => i.item_id === item.id ? { ...i, qty: i.qty + +qty } : i);
      return [...p, { item_id: item.id, item_name: item.name, qty: +qty, price: item.price }];
    });
    setSelId(''); setQty('1');
  }

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  async function saveBill() {
    if (!items.length) return toast('Bill mein koi item nahi!', 'error');
    if (payment === 'udhaar' && !customer.trim()) return toast('Credit ke liye customer naam zaroori!', 'error');
    setSaving(true);
    try {
      await Promise.all(items.map(i =>
        fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: i.item_id, item_name: i.item_name,
            qty: i.qty, amount: +(i.qty * i.price).toFixed(2),
            payment, customer: customer.trim() || 'Walk-in', phone: phone.trim(),
          }),
        }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); })
      ));
      toast('✅ Bill save ho gaya!');
      setItems([]); setCustomer(''); setPhone(''); setPayment('cash');
      await loadInv(); // await so stock is fresh
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Bill save nahi hua', 'error');
    } finally {
      setSaving(false);
    }
  }

  function printBill() {
    if (!items.length) return toast('Bill mein koi item nahi!', 'error');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Bill — ${shopName}</title><style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:monospace;padding:20px;max-width:380px;margin:auto;font-size:13px}
        h2{text-align:center;font-size:16px;margin-bottom:4px}
        .center{text-align:center;margin:2px 0;color:#555}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        th{background:#1a1a2e;color:#fff;padding:5px 8px;text-align:left;font-size:12px}
        td{padding:4px 8px;border-bottom:1px solid #eee;font-size:12px}
        .total-row td{font-weight:bold;font-size:14px;border-top:2px solid #000;border-bottom:none}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        .footer{text-align:center;font-size:11px;color:#888;margin-top:10px}
        @media print{@page{margin:5mm}}
      </style></head><body>
        <h2>${shopName}</h2>
        <p class="center">Date: ${fmtDate(new Date().toISOString())}</p>
        ${customer ? `<p class="center">Customer: ${customer}${phone ? ` | ${phone}` : ''}</p>` : ''}
        <hr/>
        <table>
          <tr><th>Part</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
          ${items.map(i => `<tr><td>${i.item_name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${(i.qty * i.price).toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="3">TOTAL</td><td>₹${total.toFixed(2)}</td></tr>
        </table>
        <hr/>
        <p class="center">Payment: ${payment.toUpperCase()}</p>
        <p class="footer">Thank you for your business! 🙏</p>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="max-w-2xl">
      <div className="form-box">
        <h3>Shop Details</h3>
        <input className="gb-input w-full" placeholder="Shop naam" value={shopName}
          onChange={e => onShopNameChange(e.target.value)} />
      </div>

      <div className="form-box">
        <h3>Customer Details</h3>
        <div className="flex flex-wrap gap-2">
          <input className="gb-input"
            placeholder={payment === 'udhaar' ? 'Customer naam *' : 'Customer naam (optional)'}
            value={customer} onChange={e => setCustomer(e.target.value)} />
          <input className="gb-input" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
          <select className="gb-input" value={payment} onChange={e => setPayment(e.target.value as typeof payment)}>
            <option value="cash">💵 Cash</option>
            <option value="online">📱 Online</option>
            <option value="udhaar">📋 Credit</option>
          </select>
        </div>
      </div>

      <div className="form-box">
        <h3>Items Add Karo</h3>
        <div className="flex flex-wrap gap-2">
          <select className="gb-input" value={selId} onChange={e => setSelId(e.target.value)}>
            <option value="">-- Part Select Karo --</option>
            {inv.map(i => (
              <option key={i.id} value={i.id} disabled={i.stock === 0}>
                {i.name}{i.company ? ` (${i.company})` : ''} — ₹{i.price} (Stock: {i.stock}){i.stock === 0 ? ' OUT' : ''}
              </option>
            ))}
          </select>
          <input className="gb-input w-24" type="number" placeholder="Qty" min="1" value={qty}
            onChange={e => setQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
          <button className="btn" onClick={addItem}>➕ Add</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="form-box">
          <h3>Bill Preview</h3>
          <table className="gb-table mb-4">
            <thead><tr><th>Part</th><th>Qty</th><th>Rate</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.item_id}>
                  <td>{i.item_name}</td>
                  <td>{i.qty}</td>
                  <td>₹{i.price}</td>
                  <td className="font-semibold">₹{(i.qty * i.price).toFixed(2)}</td>
                  <td>
                    <button className="btn-sm bg-red-500 text-white"
                      onClick={() => setItems(p => p.filter(x => x.item_id !== i.item_id))}>✖</button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="text-right">Grand Total:</td>
                <td colSpan={2} className="text-green-700 text-lg">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex gap-2 flex-wrap">
            <button className="btn" onClick={saveBill} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Bill'}
            </button>
            <button className="btn-green" onClick={printBill}>🖨️ Print Bill</button>
            <button className="btn-gray" onClick={() => setItems([])}>🗑️ Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
