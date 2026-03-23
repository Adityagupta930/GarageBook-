'use client';
import { useEffect, useState, useCallback } from 'react';
import StatCard from '@/components/StatCard';
import { LoadingRows, ErrorRow, EmptyRow } from '@/components/TableStates';
import { toast } from '@/components/Toast';
import { fmtDate, fmtCurrency, todayStr } from '@/lib/utils';
import type { Sale, InventoryItem } from '@/types';

type Range = 'today' | 'week' | 'month';

export default function Dashboard() {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [inv, setInv]         = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [range, setRange]     = useState<Range>('today');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, i] = await Promise.all([
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
      ]);
      setSales(Array.isArray(s) ? s : []);
      setInv(Array.isArray(i) ? i : []);
    } catch {
      setError('Data load nahi hua. Internet check karo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const today = todayStr();
  const filterSales = (s: Sale) => {
    const d = new Date(s.date.replace(' ', 'T'));
    const now = new Date();
    if (range === 'today') return d.toLocaleDateString('en-CA') === today;
    if (range === 'week')  { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (range === 'month') { const m = new Date(now); m.setDate(now.getDate() - 30); return d >= m; }
    return true;
  };

  const filtered  = sales.filter(filterSales);
  const income    = filtered.filter(s => s.payment !== 'udhaar').reduce((a, s) => a + Number(s.amount), 0);
  const profit    = filtered.reduce((a, s) => a + ((Number(s.amount) / Number(s.qty)) - Number(s.buy_price)) * Number(s.qty), 0);
  const credit    = sales.filter(s => s.payment === 'udhaar' && !s.udhaar_paid).reduce((a, s) => a + Number(s.amount), 0);
  const lowStock  = inv.filter(i => Number(i.stock) <= 3).length;
  const outStock  = inv.filter(i => Number(i.stock) === 0).length;

  function exportCSV() {
    if (!sales.length) return toast('Koi data nahi', 'info');
    const rows = [['Date', 'Part', 'Qty', 'Amount', 'Payment', 'Customer', 'Credit Paid']];
    sales.forEach(s => rows.push([fmtDate(s.date), s.item_name, String(s.qty), String(s.amount), s.payment, s.customer, s.udhaar_paid ? 'Yes' : 'No']));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `GarageBook_${today}.csv`;
    a.click();
    toast('CSV download ho gaya!');
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label={`${range === 'today' ? 'Aaj ki' : range === 'week' ? 'Week ki' : 'Month ki'} Kamai`} value={fmtCurrency(income)} color="green" />
        <StatCard label="Net Profit" value={fmtCurrency(profit)} color="blue" />
        <StatCard label="Credit Pending" value={fmtCurrency(credit)} color="orange" />
        <StatCard label={`Low Stock${outStock > 0 ? ` (${outStock} OUT)` : ''}`} value={lowStock} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div className="flex gap-1">
          {(['today', 'week', 'month'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${range === r ? 'bg-[#1a1a2e] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              {r === 'today' ? 'Aaj' : r === 'week' ? '7 Din' : '30 Din'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-gray text-sm px-3 py-1.5 rounded-lg" onClick={load}>🔄 Refresh</button>
          <button className="btn text-sm" onClick={exportCSV}>⬇️ CSV</button>
        </div>
      </div>

      {/* Summary row */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl px-4 py-2.5 mb-3 shadow-sm flex flex-wrap gap-4 text-sm">
          <span>📦 <b>{filtered.length}</b> sales</span>
          <span>💵 Cash: <b className="text-green-700">{fmtCurrency(filtered.filter(s => s.payment === 'cash').reduce((a, s) => a + Number(s.amount), 0))}</b></span>
          <span>📱 Online: <b className="text-blue-700">{fmtCurrency(filtered.filter(s => s.payment === 'online').reduce((a, s) => a + Number(s.amount), 0))}</b></span>
          <span>📋 Credit: <b className="text-orange-600">{fmtCurrency(filtered.filter(s => s.payment === 'udhaar').reduce((a, s) => a + Number(s.amount), 0))}</b></span>
        </div>
      )}

      <table className="gb-table">
        <thead><tr><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th><th>Date</th></tr></thead>
        <tbody>
          {loading ? <LoadingRows cols={6} /> :
           error   ? <ErrorRow cols={6} msg={error} /> :
           filtered.length === 0 ? <EmptyRow cols={6} msg="Is period mein koi sale nahi" /> :
           filtered.map(s => (
            <tr key={s.id}>
              <td className="font-medium">{s.item_name}</td>
              <td>{s.qty}</td>
              <td className="font-semibold">{fmtCurrency(Number(s.amount))}</td>
              <td><span className={`badge badge-${s.payment}`}>{s.payment === 'udhaar' ? 'CREDIT' : s.payment.toUpperCase()}</span></td>
              <td className="text-gray-600">{s.customer === 'Walk-in' ? <span className="text-gray-400">Walk-in</span> : s.customer}</td>
              <td className="text-gray-400 text-xs">{fmtDate(s.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
