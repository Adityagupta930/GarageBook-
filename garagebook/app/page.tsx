'use client';
import { useEffect, useState, useCallback } from 'react';
import StatCard from '@/components/StatCard';
import { fmtDate, fmtCurrency, todayStr } from '@/lib/utils';
import type { Sale, InventoryItem } from '@/types';

export default function Dashboard() {
  const [sales, setSales]   = useState<Sale[]>([]);
  const [inv, setInv]       = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([
      fetch('/api/sales').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
    ]);
    setSales(s); setInv(i); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const today      = todayStr();
  const todaySales = sales.filter(s => new Date(s.date).toLocaleDateString('en-CA') === today);
  const income     = todaySales.filter(s => s.payment !== 'udhaar').reduce((a, s) => a + s.amount, 0);
  const credit     = sales.filter(s => s.payment === 'udhaar' && !s.udhaar_paid).reduce((a, s) => a + s.amount, 0);
  const lowStock   = inv.filter(i => i.stock <= 3).length;

  async function exportCSV() {
    if (!sales.length) return;
    const rows = [['Date','Part','Qty','Amount','Payment','Customer','Credit Paid']];
    sales.forEach(s => rows.push([fmtDate(s.date), s.item_name, String(s.qty), String(s.amount), s.payment, s.customer, s.udhaar_paid ? 'Yes' : 'No']));
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `GarageBook_${today}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Earning" value={fmtCurrency(income)} color="green" />
        <StatCard label="Total Credit Pending" value={fmtCurrency(credit)} color="blue" />
        <StatCard label="Today's Sales" value={todaySales.length} color="orange" />
        <StatCard label="Low Stock Parts" value={lowStock} color="red" />
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Today&apos;s Transactions</h3>
        <button className="btn" onClick={exportCSV}>⬇️ Export CSV</button>
      </div>

      <table className="gb-table">
        <thead><tr><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th></tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="text-center text-gray-400 py-5">Loading...</td></tr>
          ) : todaySales.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-gray-400 py-5">No sales today</td></tr>
          ) : todaySales.map(s => (
            <tr key={s.id}>
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
