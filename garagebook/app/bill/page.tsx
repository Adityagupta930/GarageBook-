'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from '@/components/Toast';
import { fmtDate } from '@/lib/utils';
import type { InventoryItem } from '@/types';

interface BillItem { item_id: number; item_name: string; qty: number; price: number; }

export default function BillPage() {
  const [inv, setInv]           = useState<InventoryItem[]>([]);
  const [items, setItems]       = useState<BillItem[]>([]);
  const [selId, setSelId]       = useState('');
  const [qty, setQty]           = useState('1');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone]       = useState('');
  const [payment, setPayment]   = useState<'cash' | 'online' | 'udhaar'>('cash');
  const [shopName, setShopName] = useState('GarageBook Auto Parts');
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch('/api/inventory').then(r => r.json()).then(setInv); }, []);

  function addItem() {
    const item = inv.find(i => i.id === +selId);
    if (!item || !qty) return toast('Part aur qty select karo!', 'error');
    if (+qty > item.stock) return toast(`Sirf ${item.stock} stock hai!`, 'error');
    setItems(p => {
      const ex = p.find(i => i.item_id === item.id);
      if (ex) return p.map(i => i.item_id === item.id ? { ...i, qty: i.qty + +qty } : i);
      return [...p, { item_id: item.id, item_name: item.name, qty: +qty, price: item.price }];
    });
    setSelId(''); setQty('1');
  }

  function removeItem(id: number) { setItems(p => p.filter(i => i.item_id !== id)); }

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  async function saveBill() {
    if (!items.length) return toast('Bill mein koi item nahi!', 'error');
    if (payment === 'udhaar' && !customer) return toast('Credit ke liye customer naam zaroori!', 'error');
    try {
      await Promise.all(items.map(i =>
        fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: i.item_id, item_name: i.item_name, qty: i.qty, amount: i.qty * i.price, payment, customer: customer || 'Walk-in', phone }),
        }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); })
      ));
      toast('✅ Bill save ho gaya!');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  function printBill() {
    if (!items.length) return toast('Bill mein koi item nahi!', 'error');
    const win = window.open('', '_blank');
    if (!win || !billRef.current) return;
    win.document.write(`
      <html><head><title>Bill</title><style>
        body{font-family:monospace;padding:20px;max-width:400px;margin:auto}
        h2{text-align:center}p{text-align:center;margin:2px 0}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        th,td{border:1px solid #000;padding:4px 8px;font-size:13px}
        .total{font-weight:bold;font-size:15px}hr{margin:8px 0}
        @media print{button{display:none}}
      </style></head><body>
        <h2>${shopName}</h2>
        <p>Date: ${fmtDate(new Date().toISOString())}</p>
        ${customer ? `<p>Customer: ${customer}${phone ? ` | ${phone}` : ''}</p>` : ''}
        <hr/>
        <table>
          <tr><th>Part</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          ${items.map(i => `<tr><td>${i.item_name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${(i.qty * i.price).toFixed(2)}</td></tr>`).join('')}
        </table>
        <hr/>
        <p class="total">Total: ₹${total.toFixed(2)}</p>
        <p>Payment: ${payment.toUpperCase()}</p>
        <hr/><p style="text-align:center;font-size:11px">Thank you! 🙏</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="max-w-2xl">
      <div className="form-box">
        <h3>Shop Details</h3>
        <input className="gb-input w-full" placeholder="Shop naam" value={shopName} onChange={e => setShopName(e.target.value)} />
      </div>

      <div className="form-box">
        <h3>Customer Details</h3>
        <div className="flex flex-wrap gap-2">
          <input className="gb-input" placeholder="Customer naam" value={customer} onChange={e => setCustomer(e.target.value)} />
          <input className="gb-input" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
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
            {inv.map(i => <option key={i.id} value={i.id}>{i.name} (₹{i.price})</option>)}
          </select>
          <input className="gb-input w-24" type="number" placeholder="Qty" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          <button className="btn" onClick={addItem}>➕ Add</button>
        </div>
      </div>

      {items.length > 0 && (
        <div ref={billRef} className="form-box">
          <h3>Bill Preview</h3>
          <table className="gb-table mb-3">
            <thead><tr><th>Part</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.item_id}>
                  <td>{i.item_name}</td>
                  <td>{i.qty}</td>
                  <td>₹{i.price}</td>
                  <td className="font-semibold">₹{(i.qty * i.price).toFixed(2)}</td>
                  <td><button className="btn-sm bg-red-500 text-white" onClick={() => removeItem(i.item_id)}>✖</button></td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={3} className="font-bold text-right">Total:</td>
                <td colSpan={2} className="font-bold text-green-700 text-lg">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex gap-2">
            <button className="btn" onClick={saveBill}>💾 Save Bill</button>
            <button className="btn-green" onClick={printBill}>🖨️ Print Bill</button>
            <button className="btn-gray" onClick={() => setItems([])}>🗑️ Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
