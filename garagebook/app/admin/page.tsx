'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/Toast';
import { LoadingRows, ErrorRow, EmptyRow } from '@/components/TableStates';
import { fmtDate, fmtCurrency, fuzzyMatch } from '@/lib/utils';
import type { Customer, Return, ReportSummary, DailyReport, TopPart, Sale } from '@/types';
import { DailyBarChart, TopPartsChart } from '@/components/Charts';
import ConfirmModal from '@/components/ConfirmModal';
import { useRole } from '@/hooks/useRole';
import { broadcast } from '@/lib/sync';
import { getErrorLog, clearErrorLog } from '@/hooks/useErrorLogger';

type Tab = 'reports' | 'customers' | 'returns' | 'sales' | 'errorlog';

export default function AdminPage() {
  const [tab, setTab]             = useState<Tab>('reports');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [returns, setReturns]     = useState<Return[]>([]);
  const [summary, setSummary]     = useState<ReportSummary | null>(null);
  const [daily, setDaily]         = useState<DailyReport[]>([]);
  const [topParts, setTopParts]   = useState<TopPart[]>([]);
  const [cLoading, setCLoading]   = useState(false);
  const [rLoading, setRLoading]   = useState(false);
  const [sLoading, setSLoading]   = useState(false);
  const [cForm, setCForm]         = useState({ name: '', phone: '', address: '' });
  const [rForm, setRForm]         = useState({ item_name: '', qty: '', amount: '', reason: '' });
  const [confirmCust, setConfirmCust] = useState<{ id: number; name: string } | null>(null);
  const [sales, setSales]             = useState<Sale[]>([]);
  const [saleSearch, setSaleSearch]   = useState('');
  const [salLoading, setSalLoading]   = useState(false);
  const [editSale, setEditSale]       = useState<Sale | null>(null);
  const [editForm, setEditForm]       = useState<{ item_name: string; qty: string; amount: string; payment: string; customer: string; phone: string; date: string } | null>(null);
  const [confirmSaleId, setConfirmSaleId] = useState<number | null>(null);
  const [eSaving, setESaving]         = useState(false);
  const { isOwner } = useRole();
  const [errorLog, setErrorLog] = useState(() => getErrorLog());

  const loadCustomers = useCallback(async () => {
    setCLoading(true);
    try {
      const d = await fetch('/api/customers').then(r => r.json());
      setCustomers(Array.isArray(d) ? d : []);
    } finally { setCLoading(false); }
  }, []);

  const loadReturns = useCallback(async () => {
    setRLoading(true);
    try {
      const d = await fetch('/api/returns').then(r => r.json());
      setReturns(Array.isArray(d) ? d : []);
    } finally { setRLoading(false); }
  }, []);

  const loadReports = useCallback(async () => {
    setSLoading(true);
    try {
      const [s, d, t] = await Promise.all([
        fetch('/api/reports?type=summary').then(r => r.json()),
        fetch('/api/reports?type=daily').then(r => r.json()),
        fetch('/api/reports?type=topparts').then(r => r.json()),
      ]);
      setSummary(s);
      setDaily(Array.isArray(d) ? d.slice(0, 30) : []);
      setTopParts(Array.isArray(t) ? t : []);
    } finally { setSLoading(false); }
  }, []);

  const loadSales = useCallback(async () => {
    setSalLoading(true);
    try {
      const d = await fetch('/api/sales').then(r => r.json());
      setSales(Array.isArray(d) ? d : []);
    } finally { setSalLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'customers') loadCustomers();
    if (tab === 'returns')   loadReturns();
    if (tab === 'reports')   loadReports();
    if (tab === 'sales')     loadSales();
  }, [tab, loadCustomers, loadReturns, loadReports, loadSales]);

  function openEditSale(s: Sale) {
    setEditSale(s);
    setEditForm({ item_name: s.item_name, qty: String(s.qty), amount: String(s.amount), payment: s.payment, customer: s.customer, phone: s.phone || '', date: s.date.slice(0, 16) });
  }

  async function saveEditSale() {
    if (!editSale || !editForm) return;
    if (!editForm.item_name.trim()) return toast('Item naam zaroori!', 'error');
    if (editForm.payment === 'udhaar' && !editForm.customer.trim()) return toast('Customer naam zaroori!', 'error');
    setESaving(true);
    try {
      const res = await fetch(`/api/sales/${editSale.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: editForm.item_name.trim(), qty: +editForm.qty, amount: +editForm.amount, payment: editForm.payment, customer: editForm.customer.trim() || 'Walk-in', phone: editForm.phone.trim(), date: editForm.date.replace('T', ' ') + ':00' }),
      });
      const data = await res.json();
      if (!res.ok) return toast(data.error || 'Update nahi hua', 'error');
      toast('✅ Sale updated!'); broadcast('sales');
      setEditSale(null); setEditForm(null); await loadSales();
    } finally { setESaving(false); }
  }

  async function doDeleteSale(id: number) {
    const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast('Delete nahi hua', 'error');
    toast('Sale deleted', 'info'); broadcast('sales');
    setConfirmSaleId(null); await loadSales();
  }

  async function addCustomer() {
    if (!cForm.name.trim()) return toast('Customer naam zaroori!', 'error');
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cForm, name: cForm.name.trim() }) });
    const data = await res.json();
    if (!res.ok) return toast(data.error, 'error');
    toast(`${cForm.name} add ho gaya!`);
    broadcast('customers');
    setCForm({ name: '', phone: '', address: '' });
    await loadCustomers();
  }

  async function deleteCustomer(id: number, name: string) {
    setConfirmCust({ id, name });
  }

  async function doDeleteCustomer(id: number, name: string) {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast('Delete nahi hua', 'error');
    toast(`${name} deleted`, 'info');
    broadcast('customers');
    setConfirmCust(null);
    await loadCustomers();
  }

  async function addReturn() {
    if (!rForm.item_name.trim() || !rForm.qty || !rForm.amount) return toast('Sab fields bharo!', 'error');
    const res = await fetch('/api/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rForm, item_name: rForm.item_name.trim(), qty: +rForm.qty, amount: +rForm.amount }) });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Return failed', 'error');
    toast('Return darj ho gaya!');
    broadcast('returns');
    setRForm({ item_name: '', qty: '', amount: '', reason: '' });
    await loadReturns();
  }

  const tabs: { key: Tab; label: string; ownerOnly?: boolean }[] = [
    { key: 'reports',   label: '📊 Reports' },
    { key: 'sales',     label: '🛒 Sales',     ownerOnly: true },
    { key: 'customers', label: '👥 Customers' },
    { key: 'returns',   label: '↩️ Returns' },
    { key: 'errorlog',  label: '🛠️ Error Log', ownerOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.ownerOnly || isOwner);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#e94560] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* REPORTS */}
      {tab === 'reports' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-gray text-sm px-3 py-1.5 rounded-lg" onClick={loadReports}>🔄 Refresh</button>
          </div>

          {sLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {Array.from({ length: 7 }).map((_, i) => <div key={i} className="bg-gray-200 rounded-xl p-5 animate-pulse h-20" />)}
            </div>
          ) : summary ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Sales',    value: fmtCurrency(summary.totalSales),    color: 'bg-green-600' },
                  { label: 'Cash Sales',     value: fmtCurrency(summary.cashSales),     color: 'bg-blue-600' },
                  { label: 'Online Sales',   value: fmtCurrency(summary.onlineSales),   color: 'bg-indigo-600' },
                  { label: 'Credit Sales',   value: fmtCurrency(summary.creditSales),   color: 'bg-orange-500' },
                  { label: 'Net Profit',     value: fmtCurrency(summary.profit),        color: 'bg-emerald-600' },
                  { label: 'Items Sold',     value: String(summary.totalItems ?? 0),    color: 'bg-purple-600' },
                  { label: 'Pending Credit', value: fmtCurrency(summary.pendingCredit), color: 'bg-red-600' },
                ].map(c => (
                  <div key={c.label} className={`${c.color} text-white rounded-xl p-4`}>
                    <p className="text-xs opacity-80">{c.label}</p>
                    <p className="text-xl font-bold mt-1">{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily Bar Chart */}
              {daily.length > 0 && (
                <div className="form-box">
                  <h3>Last 30 Days — Daily Sales (Revenue vs Profit)</h3>
                  <DailyBarChart data={daily} />
                </div>
              )}

              {/* Top Parts Chart + Table */}
              {topParts.length > 0 && (
                <div className="form-box">
                  <h3>🏆 Top Selling Parts</h3>
                  <TopPartsChart data={topParts} />
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">Koi data nahi</p>
          )}
        </div>
      )}

      {/* CUSTOMERS */}
      {tab === 'customers' && (
        <div>
          <div className="form-box">
            <h3>Naya Customer Add Karo</h3>
            <div className="flex flex-wrap gap-2">
              <input className="gb-input" placeholder="Naam *" value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))} />
              <input className="gb-input" placeholder="Phone" value={cForm.phone} onChange={e => setCForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="gb-input" placeholder="Address" value={cForm.address} onChange={e => setCForm(p => ({ ...p, address: e.target.value }))} />
              <button className="btn" onClick={addCustomer}>➕ Add</button>
            </div>
          </div>
          <table className="gb-table">
            <thead><tr><th>Naam</th><th>Phone</th><th>Address</th><th>Action</th></tr></thead>
            <tbody>
              {cLoading ? <LoadingRows cols={4} /> :
               customers.length === 0 ? <EmptyRow cols={4} msg="Koi customer nahi" /> :
               customers.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.phone || '-'}</td>
                  <td className="text-gray-500 text-xs">{c.address || '-'}</td>
                  <td><button className="btn-sm bg-red-500 text-white" onClick={() => deleteCustomer(c.id, c.name)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {confirmCust && (
            <ConfirmModal
              message={`"${confirmCust.name}" permanently delete karo?`}
              onConfirm={() => doDeleteCustomer(confirmCust.id, confirmCust.name)}
              onCancel={() => setConfirmCust(null)}
            />
          )}
        </div>
      )}

      {/* SALES — Admin Edit */}
      {tab === 'sales' && isOwner && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="gb-input" style={{ maxWidth: '280px' }} placeholder="🔍 Part / Customer search..." value={saleSearch} onChange={e => setSaleSearch(e.target.value)} />
            <button className="btn-gray text-sm" onClick={loadSales}>🔄 Refresh</button>
            <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: 'auto' }}>{sales.length} records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="gb-table">
              <thead><tr><th>Date</th><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th><th>Actions</th></tr></thead>
              <tbody>
                {salLoading ? <LoadingRows cols={7} /> :
                 sales.filter(s => !saleSearch || fuzzyMatch(s.item_name + ' ' + s.customer, saleSearch))
                 .map(s => (
                  <tr key={s.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtDate(s.date)}</td>
                    <td style={{ fontWeight: 500 }}>{s.item_name}</td>
                    <td>{s.qty}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(s.amount)}</td>
                    <td><span className={`badge badge-${s.payment}`}>{s.payment.toUpperCase()}</span></td>
                    <td>{s.customer}</td>
                    <td style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-sm bg-blue-500 text-white" onClick={() => openEditSale(s)}>✏️</button>
                      <button className="btn-sm bg-red-500 text-white" onClick={() => setConfirmSaleId(s.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editSale && editForm && (
            <div className="modal-overlay" onClick={() => { setEditSale(null); setEditForm(null); }}>
              <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <h3>✏️ Sale Edit — #{editSale.id}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Part Name</label>
                    <input className="gb-input w-full mt-1" value={editForm.item_name} onChange={e => setEditForm(p => p ? { ...p, item_name: e.target.value } : p)} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '90px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Qty</label>
                      <input className="gb-input w-full mt-1" type="number" min="1" value={editForm.qty} onChange={e => setEditForm(p => p ? { ...p, qty: e.target.value } : p)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '110px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount ₹</label>
                      <input className="gb-input w-full mt-1" type="number" min="0" value={editForm.amount} onChange={e => setEditForm(p => p ? { ...p, amount: e.target.value } : p)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '130px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Payment</label>
                      <select className="gb-input w-full mt-1" value={editForm.payment} onChange={e => setEditForm(p => p ? { ...p, payment: e.target.value } : p)}>
                        <option value="cash">💵 Cash</option>
                        <option value="online">📱 Online</option>
                        <option value="udhaar">📋 Credit</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Customer</label>
                      <input className="gb-input w-full mt-1" value={editForm.customer} onChange={e => setEditForm(p => p ? { ...p, customer: e.target.value } : p)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Phone</label>
                      <input className="gb-input w-full mt-1" value={editForm.phone} onChange={e => setEditForm(p => p ? { ...p, phone: e.target.value } : p)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Date & Time</label>
                    <input className="gb-input w-full mt-1" type="datetime-local" value={editForm.date} onChange={e => setEditForm(p => p ? { ...p, date: e.target.value } : p)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn-gray" onClick={() => { setEditSale(null); setEditForm(null); }}>Cancel</button>
                  <button className="btn" onClick={saveEditSale} disabled={eSaving}>{eSaving ? '⏳...' : '💾 Save'}</button>
                </div>
              </div>
            </div>
          )}

          {confirmSaleId !== null && (
            <ConfirmModal
              message="Ye sale permanently delete karo?"
              onConfirm={() => doDeleteSale(confirmSaleId)}
              onCancel={() => setConfirmSaleId(null)}
            />
          )}
        </div>
      )}

      {/* RETURNS */}
      {tab === 'returns' && (
        <div>
          <div className="form-box">
            <h3>Return Darj Karo</h3>
            <div className="flex flex-wrap gap-2">
              <input className="gb-input" placeholder="Part naam *" value={rForm.item_name} onChange={e => setRForm(p => ({ ...p, item_name: e.target.value }))} />
              <input className="gb-input w-24" type="number" placeholder="Qty *" min="1" value={rForm.qty} onChange={e => setRForm(p => ({ ...p, qty: e.target.value }))} />
              <input className="gb-input w-28" type="number" placeholder="Amount ₹ *" min="0" value={rForm.amount} onChange={e => setRForm(p => ({ ...p, amount: e.target.value }))} />
              <input className="gb-input" placeholder="Reason" value={rForm.reason} onChange={e => setRForm(p => ({ ...p, reason: e.target.value }))} />
              <button className="btn" onClick={addReturn}>↩️ Return</button>
            </div>
          </div>
          <table className="gb-table">
            <thead><tr><th>Date</th><th>Part</th><th>Qty</th><th>Amount</th><th>Reason</th></tr></thead>
            <tbody>
              {rLoading ? <LoadingRows cols={5} /> :
               returns.length === 0 ? <EmptyRow cols={5} msg="Koi return nahi" /> :
               returns.map(r => (
                <tr key={r.id}>
                  <td className="text-xs text-gray-500">{fmtDate(r.date)}</td>
                  <td>{r.item_name}</td>
                  <td>{r.qty}</td>
                  <td>{fmtCurrency(r.amount)}</td>
                  <td className="text-gray-500 text-xs">{r.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ERROR LOG */}
      {tab === 'errorlog' && isOwner && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{errorLog.length} errors logged</span>
            <button className="btn-gray text-sm" onClick={() => { clearErrorLog(); setErrorLog([]); toast('Log cleared', 'info'); }}>
              🗑️ Clear Log
            </button>
          </div>
          {errorLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '14px' }}>✅ Koi error nahi</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {errorLog.map((e, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid #fca5a5',
                  borderRadius: '8px', padding: '10px 14px', fontSize: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{e.msg}</span>
                    <span style={{ color: 'var(--text3)' }}>{e.url} · {new Date(e.ts).toLocaleTimeString()}</span>
                  </div>
                  {e.stack && <pre style={{ color: 'var(--text3)', fontSize: '11px', overflow: 'auto', maxHeight: '80px', margin: 0 }}>{e.stack.split('\n').slice(0, 3).join('\n')}</pre>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
