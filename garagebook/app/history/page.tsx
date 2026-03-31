'use client';
import { useEffect, useState, useCallback } from 'react';
import { LoadingRows, ErrorRow, EmptyRow } from '@/components/TableStates';
import { toast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { fmtDate, fmtCurrency, fuzzyMatch } from '@/lib/utils';
import { listenSync, broadcast } from '@/lib/sync';
import type { Sale } from '@/types';

type EditForm = { item_name: string; qty: string; amount: string; payment: string; customer: string; phone: string; date: string; };

export default function HistoryPage() {
  const [sales, setSales]         = useState<Sale[]>([]);
  const [date, setDate]           = useState('');
  const [payment, setPayment]     = useState('');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editSale, setEditSale]   = useState<Sale | null>(null);
  const [editForm, setEditForm]   = useState<EditForm | null>(null);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (date)    { params.set('from', date); params.set('to', date); }
      if (payment) params.set('payment', payment);
      setSales(await fetch(`/api/sales?${params}`).then(async r => { const d = await r.json(); return Array.isArray(d) ? d : []; }));
    } catch {
      setError('History load nahi hui.');
    } finally {
      setLoading(false);
    }
  }, [date, payment]);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    const unsync = listenSync(['sales'], load);
    return () => { document.removeEventListener('visibilitychange', onVisible); unsync(); };
  }, [load]);

  function openEdit(s: Sale) {
    setEditSale(s);
    setEditForm({
      item_name: s.item_name,
      qty:       String(s.qty),
      amount:    String(s.amount),
      payment:   s.payment,
      customer:  s.customer,
      phone:     s.phone || '',
      date:      s.date.slice(0, 16), // datetime-local format
    });
  }

  async function saveEdit() {
    if (!editSale || !editForm) return;
    if (!editForm.item_name.trim()) return toast('Item naam zaroori!', 'error');
    if (!editForm.qty || +editForm.qty <= 0) return toast('Valid qty daalo!', 'error');
    if (editForm.payment === 'udhaar' && !editForm.customer.trim()) return toast('Customer naam zaroori!', 'error');
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${editSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: editForm.item_name.trim(),
          qty:       +editForm.qty,
          amount:    +editForm.amount,
          payment:   editForm.payment,
          customer:  editForm.customer.trim() || 'Walk-in',
          phone:     editForm.phone.trim(),
          date:      editForm.date.replace('T', ' ') + ':00',
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast(data.error || 'Update nahi hua', 'error');
      toast('✅ Sale update ho gaya!');
      broadcast('sales');
      setEditSale(null); setEditForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function doDelete(id: number) {
    const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast('Delete nahi hua', 'error');
    toast('Sale deleted', 'info');
    broadcast('sales');
    setConfirmId(null);
    await load();
  }

  const ef = (f: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm(p => p ? { ...p, [f]: e.target.value } : p);

  const filtered = sales.filter(s =>
    !search || fuzzyMatch(s.item_name + ' ' + s.customer, search)
  );
  const total = filtered.reduce((a, s) => a + s.amount, 0);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input className="gb-input max-w-xs" placeholder="🔍 Part / Customer search..." value={search} onChange={e => setSearch(e.target.value)} />
        <input type="date" className="gb-input max-w-xs" value={date} onChange={e => setDate(e.target.value)} />
        <select className="gb-input max-w-xs" value={payment} onChange={e => setPayment(e.target.value)}>
          <option value="">All Payments</option>
          <option value="cash">💵 Cash</option>
          <option value="online">📱 Online</option>
          <option value="udhaar">📋 Credit</option>
        </select>
        <button className="btn-gray text-sm px-3 py-2 rounded-lg"
          onClick={() => { setDate(''); setPayment(''); setSearch(''); }}>✖ Clear</button>
        {!loading && filtered.length > 0 && (
          <span className="text-sm text-gray-600 ml-auto">
            {filtered.length} records — <span className="font-bold text-green-700">{fmtCurrency(total)}</span>
          </span>
        )}
      </div>

      <table className="gb-table">
        <thead><tr><th>Date</th><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th><th>Actions</th></tr></thead>
        <tbody>
          {loading ? <LoadingRows cols={7} /> :
           error   ? <ErrorRow cols={7} msg={error} /> :
           filtered.length === 0 ? <EmptyRow cols={7} msg="Koi record nahi mila" /> :
           filtered.map(s => (
            <tr key={s.id}>
              <td className="text-xs text-gray-500">{fmtDate(s.date)}</td>
              <td className="font-medium">{s.item_name}</td>
              <td>{s.qty}</td>
              <td className="font-semibold">{fmtCurrency(s.amount)}</td>
              <td><span className={`badge badge-${s.payment}`}>{s.payment.toUpperCase()}</span></td>
              <td style={{ color: s.customer === 'Walk-in' ? 'var(--text3)' : 'var(--text)' }}>{s.customer}</td>
              <td style={{ display: 'flex', gap: '4px' }}>
                <button className="btn-sm bg-blue-500 text-white" onClick={() => openEdit(s)}>✏️</button>
                <button className="btn-sm bg-red-500 text-white" onClick={() => setConfirmId(s.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editSale && editForm && (
        <div className="modal-overlay" onClick={() => { setEditSale(null); setEditForm(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3>✏️ Sale Edit Karo — #{editSale.id}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Part Name</label>
                <input className="gb-input w-full mt-1" value={editForm.item_name} onChange={ef('item_name')} />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Qty</label>
                  <input className="gb-input w-full mt-1" type="number" min="1" value={editForm.qty} onChange={ef('qty')} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount ₹</label>
                  <input className="gb-input w-full mt-1" type="number" min="0" value={editForm.amount} onChange={ef('amount')} />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Payment</label>
                  <select className="gb-input w-full mt-1" value={editForm.payment} onChange={ef('payment')}>
                    <option value="cash">💵 Cash</option>
                    <option value="online">📱 Online</option>
                    <option value="udhaar">📋 Credit</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Customer</label>
                  <input className="gb-input w-full mt-1"
                    placeholder={editForm.payment === 'udhaar' ? 'Zaroori *' : 'Optional'}
                    value={editForm.customer} onChange={ef('customer')} />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Phone</label>
                  <input className="gb-input w-full mt-1" value={editForm.phone} onChange={ef('phone')} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Date & Time</label>
                <input className="gb-input w-full mt-1" type="datetime-local" value={editForm.date} onChange={ef('date')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-gray" onClick={() => { setEditSale(null); setEditForm(null); }}>Cancel</button>
              <button className="btn" onClick={saveEdit} disabled={saving}>{saving ? '⏳...' : '💾 Save'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmModal
          message="Ye sale permanently delete karo?"
          onConfirm={() => doDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
