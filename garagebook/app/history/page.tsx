'use client';
import { useEffect, useState, useCallback } from 'react';
import { LoadingRows, ErrorRow, EmptyRow } from '@/components/TableStates';
import { fmtDate, fmtCurrency } from '@/lib/utils';
import type { Sale } from '@/types';

export default function HistoryPage() {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [date, setDate]       = useState('');
  const [payment, setPayment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (date)    { params.set('from', date); params.set('to', date); }
      if (payment) params.set('payment', payment);
      setSales(await fetch(`/api/sales?${params}`).then(r => r.json()));
    } catch {
      setError('History load nahi hui.');
    } finally {
      setLoading(false);
    }
  }, [date, payment]);

  useEffect(() => { load(); }, [load]);

  const total = sales.reduce((a, s) => a + s.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input type="date" className="gb-input max-w-xs" value={date} onChange={e => setDate(e.target.value)} />
        <select className="gb-input max-w-xs" value={payment} onChange={e => setPayment(e.target.value)}>
          <option value="">All Payments</option>
          <option value="cash">💵 Cash</option>
          <option value="online">📱 Online</option>
          <option value="udhaar">📋 Credit</option>
        </select>
        <button className="btn-gray text-sm px-3 py-2 rounded-lg"
          onClick={() => { setDate(''); setPayment(''); }}>✖ Clear</button>
        {!loading && sales.length > 0 && (
          <span className="text-sm text-gray-600 ml-auto">
            {sales.length} records — <span className="font-bold text-green-700">{fmtCurrency(total)}</span>
          </span>
        )}
      </div>

      <table className="gb-table">
        <thead><tr><th>Date</th><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th></tr></thead>
        <tbody>
          {loading ? <LoadingRows cols={6} /> :
           error   ? <ErrorRow cols={6} msg={error} /> :
           sales.length === 0 ? <EmptyRow cols={6} msg="Koi record nahi mila" /> :
           sales.map(s => (
            <tr key={s.id}>
              <td className="text-xs text-gray-500">{fmtDate(s.date)}</td>
              <td>{s.item_name}</td>
              <td>{s.qty}</td>
              <td>{fmtCurrency(s.amount)}</td>
              <td><span className={`badge badge-${s.payment}`}>{s.payment.toUpperCase()}</span></td>
              <td>{s.customer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
