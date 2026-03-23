'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';
import type { InventoryItem } from '@/types';

export default function SalePage() {
  const [inv, setInv]           = useState<InventoryItem[]>([]);
  const [itemId, setItemId]     = useState('');
  const [qty, setQty]           = useState('1');
  const [price, setPrice]       = useState('');
  const [discount, setDiscount] = useState('0');
  const [payment, setPayment]   = useState<'cash' | 'online' | 'udhaar'>('cash');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone]       = useState('');
  const [saving, setSaving]     = useState(false);

  const loadInv = useCallback(async () => {
    const data: InventoryItem[] = await fetch('/api/inventory').then(r => r.json());
    setInv(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { loadInv(); }, [loadInv]);

  const baseAmount = price ? (+qty * +price) : 0;
  const finalAmount = Math.max(0, baseAmount - +discount).toFixed(2);

  function onItemSelect(id: string) {
    setItemId(id);
    setDiscount('0');
    const item = inv.find(i => i.id === +id);
    if (item) setPrice(String(item.price));
    else setPrice('');
  }

  function onQtyChange(q: string) {
    setQty(q);
  }

  async function recordSale() {
    if (!itemId) return toast('Part select karo!', 'error');
    if (!qty || +qty <= 0) return toast('Valid qty daalo!', 'error');
    if (payment === 'udhaar' && !customer.trim()) return toast('Credit ke liye customer naam zaroori!', 'error');

    const item = inv.find(i => i.id === +itemId);
    if (!item) return toast('Part nahi mila!', 'error');
    if (+qty > item.stock) return toast(`Sirf ${item.stock} stock bacha hai!`, 'error');

    setSaving(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: +itemId, item_name: item.name,
          qty: +qty, amount: +finalAmount,
          payment, customer: customer.trim(), phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast(data.error, 'error');
      toast(`✅ ${item.name} ×${qty} = ₹${finalAmount} (${payment.toUpperCase()})`);
      setItemId(''); setQty('1'); setPrice(''); setDiscount('0');
      setCustomer(''); setPhone(''); setPayment('cash');
      await loadInv();
    } finally {
      setSaving(false);
    }
  }

  const selectedItem = inv.find(i => i.id === +itemId);

  return (
    <div className="form-box max-w-2xl">
      <h3>Naya Sale Darj Karo</h3>

      {/* Part + Qty */}
      <div className="flex flex-wrap gap-2 mb-3">
        <select className="gb-input" value={itemId} onChange={e => onItemSelect(e.target.value)}>
          <option value="">-- Part Select Karo --</option>
          {inv.map(i => (
            <option key={i.id} value={i.id} disabled={i.stock === 0}>
              {i.name}{i.company ? ` (${i.company})` : ''} — Stock: {i.stock}{i.stock === 0 ? ' ❌ OUT' : ''}
            </option>
          ))}
        </select>
        <input className="gb-input w-24" type="number" placeholder="Qty" min="1"
          max={selectedItem?.stock} value={qty} onChange={e => onQtyChange(e.target.value)} />
      </div>

      {/* Stock indicator */}
      {selectedItem && (
        <div className="flex items-center gap-3 mb-3 text-sm">
          <span>Stock bacha:
            <b className={selectedItem.stock === 0 ? 'text-red-600' : selectedItem.stock <= 3 ? 'text-orange-500' : 'text-green-600'}>
              {' '}{selectedItem.stock}
            </b>
          </span>
          <span className="text-gray-400">|</span>
          <span>Rate: <b>₹{selectedItem.price}</b></span>
          <span className="text-gray-400">|</span>
          <span>Subtotal: <b>₹{baseAmount.toFixed(2)}</b></span>
        </div>
      )}

      {/* Price + Discount + Final */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex flex-col gap-1 flex-1 min-w-36">
          <label className="text-xs text-gray-500">Unit Price ₹</label>
          <input className="gb-input" type="number" placeholder="Price ₹" value={price} readOnly />
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label className="text-xs text-gray-500">Discount ₹</label>
          <input className="gb-input" type="number" placeholder="0" min="0"
            value={discount} onChange={e => setDiscount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-xs text-gray-500">Final Amount ₹</label>
          <input className="gb-input bg-green-50 font-semibold" type="number" value={finalAmount} readOnly />
        </div>
      </div>

      {/* Payment + Customer */}
      <div className="flex flex-wrap gap-2">
        <select className="gb-input" value={payment} onChange={e => setPayment(e.target.value as typeof payment)}>
          <option value="cash">💵 Cash</option>
          <option value="online">📱 Online</option>
          <option value="udhaar">📋 Credit (Udhaar)</option>
        </select>
        <input className="gb-input"
          placeholder={payment === 'udhaar' ? 'Customer naam (zaroori!) *' : 'Customer naam (optional)'}
          value={customer} onChange={e => setCustomer(e.target.value)} />
        <input className="gb-input" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
        <button className="btn w-full mt-1" onClick={recordSale} disabled={saving}>
          {saving ? '⏳ Saving...' : '✅ Sale Save Karo'}
        </button>
      </div>
    </div>
  );
}
