'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';
import { LoadingRows, ErrorRow, EmptyRow } from '@/components/TableStates';
import { fmtDate, fmtCurrency } from '@/lib/utils';
import { listenSync, broadcast } from '@/lib/sync';
import type { Sale } from '@/types';

interface CreditGroup { customer: string; phone: string; total: number; }

export default function CreditPage() {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [modal, setModal]     = useState<{ customer: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetch('/api/sales').then(r => r.json());
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setError('Credit data load nahi hua.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    const unsync = listenSync(['sales'], load);
    return () => { document.removeEventListener('visibilitychange', onVisible); unsync(); };
  }, [load]);

  const pending = sales.filter(s => s.payment === 'udhaar' && !s.udhaar_paid);
  const groups  = Object.values(
    pending.reduce<Record<string, CreditGroup>>((acc, s) => {
      const k = `${s.customer}||${s.phone}`;
      if (!acc[k]) acc[k] = { customer: s.customer, phone: s.phone, total: 0 };
      acc[k].total += s.amount;
      return acc;
    }, {})
  );

  async function markPaid(id: number) {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'paid' }),
    });
    if (!res.ok) return toast('Update nahi hua', 'error');
    toast('✅ Paid mark ho gaya!');
    broadcast('sales');
    await load();
  }

  async function markAllPaid(customer: string, phone: string) {
    const toMark = sales.filter(s => s.payment === 'udhaar' && !s.udhaar_paid && s.customer === customer && s.phone === phone);
    await Promise.all(toMark.map(s =>
      fetch(`/api/sales/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'paid' }),
      })
    ));
    toast(`✅ ${toMark.length} items paid mark ho gaye!`);
    broadcast('sales');
    setModal(null);
    await load();
  }

  const modalSales = modal
    ? sales.filter(s => s.payment === 'udhaar' && s.customer === modal.customer && s.phone === modal.phone)
    : [];

  const totalPending = groups.reduce((a, g) => a + g.total, 0);

  function sendCreditReminder(customer: string, phone: string, amount: number) {
    const num = phone.replace(/\D/g, '');
    if (!num) return toast('Is customer ka phone number nahi hai', 'error');
    const intlNum = num.startsWith('91') ? num : `91${num}`;
    const msg = [
      `🔔 *Porwal Autoparts — Payment Reminder*`,
      ``,
      `Namaste *${customer}* ji,`,
      ``,
      `Aapka ₹${amount.toFixed(0)} ka udhaar pending hai.`,
      `Kripa karke jald se jald payment kar dijiye.`,
      ``,
      `_Dhanyawad 🙏_`,
      `*Porwal Autoparts*`,
    ].join('\n');
    window.open(`https://wa.me/${intlNum}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">📋 Credit Book — Pending Payments</h3>
        {!loading && groups.length > 0 && (
          <span className="text-red-600 font-bold text-sm">Total: {fmtCurrency(totalPending)}</span>
        )}
      </div>

      <table className="gb-table">
        <thead><tr><th>Customer</th><th>Phone</th><th>Amount Due</th><th>Action</th></tr></thead>
        <tbody>
          {loading ? <LoadingRows cols={4} /> :
           error   ? <ErrorRow cols={4} msg={error} /> :
           groups.length === 0 ? <EmptyRow cols={4} msg="Koi pending credit nahi! 🎉" /> :
           groups.map(g => (
            <tr key={g.customer + g.phone}>
              <td className="font-medium">{g.customer}</td>
              <td>{g.phone || '-'}</td>
              <td className="text-red-600 font-bold">{fmtCurrency(g.total)}</td>
              <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button className="btn-sm bg-purple-600 text-white"
                  onClick={() => setModal({ customer: g.customer, phone: g.phone })}>
                  👁 View
                </button>
                {g.phone && (
                  <button className="btn-sm text-white"
                    style={{ background: '#25d366' }}
                    onClick={() => sendCreditReminder(g.customer, g.phone, g.total)}
                    title="WhatsApp reminder bhejo">
                    📱 Remind
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {modal.customer}{modal.phone ? ` — ${modal.phone}` : ''}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {modalSales.some(s => !s.udhaar_paid) && (
                  <button
                    className="btn-green"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => markAllPaid(modal.customer, modal.phone)}>
                    ✅ Mark All Paid
                  </button>
                )}
                <button className="text-gray-400 hover:text-gray-700 text-xl" onClick={() => setModal(null)}>✕</button>
              </div>
            </div>
            <table className="gb-table">
              <thead><tr><th>Date</th><th>Part</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {modalSales.length === 0
                  ? <tr><td colSpan={5} className="text-center text-gray-400 py-4">Koi record nahi</td></tr>
                  : modalSales.map(s => (
                  <tr key={s.id}>
                    <td className="text-xs text-gray-500">{fmtDate(s.date)}</td>
                    <td>{s.item_name} ×{s.qty}</td>
                    <td>{fmtCurrency(s.amount)}</td>
                    <td>
                      <span className={`badge ${s.udhaar_paid ? 'badge-paid' : 'badge-udhaar'}`}>
                        {s.udhaar_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {!s.udhaar_paid && (
                        <button className="btn-sm bg-green-600 text-white" onClick={() => markPaid(s.id)}>
                          ✅ Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-gray mt-4" onClick={() => setModal(null)}>❌ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
