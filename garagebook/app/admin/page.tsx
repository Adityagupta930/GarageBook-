'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';
import { fmtDate, fmtCurrency } from '@/lib/utils';
import type { Customer, Return, ReportSummary } from '@/types';

type Tab = 'customers' | 'returns' | 'reports';

export default function AdminPage() {
  const [tab, setTab]           = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [returns, setReturns]   = useState<Return[]>([]);
  const [summary, setSummary]   = useState<ReportSummary | null>(null);
  const [cForm, setCForm]       = useState({ name: '', phone: '', address: '' });
  const [rForm, setRForm]       = useState({ item_name: '', qty: '', amount: '', reason: '' });

  const loadCustomers = useCallback(async () => {
    setCustomers(await fetch('/api/customers').then(r => r.json()));
  }, []);

  const loadReturns = useCallback(async () => {
    setReturns(await fetch('/api/returns').then(r => r.json()));
  }, []);

  const loadSummary = useCallback(async () => {
    setSummary(await fetch('/api/reports?type=summary').then(r => r.json()));
  }, []);

  useEffect(() => {
    if (tab === 'customers') loadCustomers();
    if (tab === 'returns')   loadReturns();
    if (tab === 'reports')   loadSummary();
  }, [tab, loadCustomers, loadReturns, loadSummary]);

  async function addCustomer() {
    if (!cForm.name) return toast('Customer naam zaroori!', 'error');
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cForm) });
    const data = await res.json();
    if (!res.ok) return toast(data.error, 'error');
    toast(`${cForm.name} add ho gaya!`);
    setCForm({ name: '', phone: '', address: '' });
    loadCustomers();
  }

  async function deleteCustomer(id: number, name: string) {
    if (!confirm(`"${name}" delete karo?`)) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    toast(`${name} deleted`, 'info');
    loadCustomers();
  }

  async function addReturn() {
    if (!rForm.item_name || !rForm.qty || !rForm.amount) return toast('Sab fields bharo!', 'error');
    const res = await fetch('/api/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rForm, qty: +rForm.qty, amount: +rForm.amount }) });
    if (!res.ok) return toast('Return failed', 'error');
    toast('Return darj ho gaya!');
    setRForm({ item_name: '', qty: '', amount: '', reason: '' });
    loadReturns();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'customers', label: '👥 Customers' },
    { key: 'returns',   label: '↩️ Returns' },
    { key: 'reports',   label: '📊 Reports' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#e94560] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'customers' && (
        <div>
          <div className="form-box">
            <h3>Naya Customer Add Karo</h3>
            <div className="flex flex-wrap gap-2">
              <input className="gb-input" placeholder="Naam" value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))} />
              <input className="gb-input" placeholder="Phone" value={cForm.phone} onChange={e => setCForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="gb-input" placeholder="Address" value={cForm.address} onChange={e => setCForm(p => ({ ...p, address: e.target.value }))} />
              <button className="btn" onClick={addCustomer}>➕ Add</button>
            </div>
          </div>
          <table className="gb-table">
            <thead><tr><th>Naam</th><th>Phone</th><th>Address</th><th>Action</th></tr></thead>
            <tbody>
              {customers.length === 0
                ? <tr><td colSpan={4} className="text-center text-gray-400 py-5">Koi customer nahi</td></tr>
                : customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td><td>{c.phone || '-'}</td><td>{c.address || '-'}</td>
                    <td><button className="btn-sm bg-red-500 text-white" onClick={() => deleteCustomer(c.id, c.name)}>🗑️</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'returns' && (
        <div>
          <div className="form-box">
            <h3>Return Darj Karo</h3>
            <div className="flex flex-wrap gap-2">
              <input className="gb-input" placeholder="Part naam" value={rForm.item_name} onChange={e => setRForm(p => ({ ...p, item_name: e.target.value }))} />
              <input className="gb-input w-24" type="number" placeholder="Qty" value={rForm.qty} onChange={e => setRForm(p => ({ ...p, qty: e.target.value }))} />
              <input className="gb-input w-28" type="number" placeholder="Amount ₹" value={rForm.amount} onChange={e => setRForm(p => ({ ...p, amount: e.target.value }))} />
              <input className="gb-input" placeholder="Reason" value={rForm.reason} onChange={e => setRForm(p => ({ ...p, reason: e.target.value }))} />
              <button className="btn" onClick={addReturn}>↩️ Return</button>
            </div>
          </div>
          <table className="gb-table">
            <thead><tr><th>Date</th><th>Part</th><th>Qty</th><th>Amount</th><th>Reason</th></tr></thead>
            <tbody>
              {returns.length === 0
                ? <tr><td colSpan={5} className="text-center text-gray-400 py-5">Koi return nahi</td></tr>
                : returns.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td><td>{r.item_name}</td><td>{r.qty}</td>
                    <td>{fmtCurrency(r.amount)}</td><td>{r.reason || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reports' && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Sales',     value: fmtCurrency(summary.totalSales),   color: 'bg-green-600' },
            { label: 'Cash Sales',      value: fmtCurrency(summary.cashSales),    color: 'bg-blue-600' },
            { label: 'Online Sales',    value: fmtCurrency(summary.onlineSales),  color: 'bg-indigo-600' },
            { label: 'Credit Sales',    value: fmtCurrency(summary.creditSales),  color: 'bg-orange-500' },
            { label: 'Net Profit',      value: fmtCurrency(summary.profit),       color: 'bg-emerald-600' },
            { label: 'Pending Credit',  value: fmtCurrency(summary.pendingCredit),color: 'bg-red-600' },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-xl p-5`}>
              <p className="text-sm opacity-90">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
