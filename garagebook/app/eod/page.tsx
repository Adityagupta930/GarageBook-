'use client';
import { useEffect, useState, useCallback } from 'react';
import { fmtCurrency, todayStr } from '@/lib/utils';
import { toast } from '@/components/Toast';
import type { Sale, Expense } from '@/types';

export default function EODPage() {
  const [sales, setSales]       = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [date, setDate]         = useState(todayStr());

  const load = useCallback(async () => {
    setLoading(true);
    const [s, e] = await Promise.all([
      fetch(`/api/sales?limit=500`).then(r => r.json()),
      fetch(`/api/expenses`).then(r => r.json()),
    ]);
    setSales(Array.isArray(s) ? s : []);
    setExpenses(Array.isArray(e) ? e : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const daySales    = sales.filter(s => s.date.startsWith(date));
  const cash        = daySales.filter(s => s.payment === 'cash').reduce((a, s) => a + Number(s.amount), 0);
  const online      = daySales.filter(s => s.payment === 'online').reduce((a, s) => a + Number(s.amount), 0);
  const credit      = daySales.filter(s => s.payment === 'udhaar').reduce((a, s) => a + Number(s.amount), 0);
  const totalIncome = cash + online;
  const profit      = daySales.reduce((a, s) => a + ((Number(s.amount) / Number(s.qty)) - Number(s.buy_price)) * Number(s.qty), 0);
  const dayExpenses = expenses.filter(e => e.date.startsWith(date)).reduce((a, e) => a + Number(e.amount), 0);
  const netProfit   = profit - dayExpenses;
  const itemsSold   = daySales.reduce((a, s) => a + Number(s.qty), 0);
  const creditPending = daySales.filter(s => s.payment === 'udhaar' && !s.udhaar_paid).reduce((a, s) => a + Number(s.amount), 0);

  function printReport() {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = daySales.map(s =>
      `<tr><td>${s.item_name}</td><td>${s.qty}</td><td>₹${Number(s.amount).toFixed(0)}</td><td>${s.payment === 'udhaar' ? 'Credit' : s.payment}</td><td>${s.customer}</td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>EOD Report ${date}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:sans-serif;padding:24px;background:#fff;color:#111}
      h1{font-size:18px;font-weight:700;margin-bottom:4px}
      .sub{font-size:12px;color:#666;margin-bottom:20px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
      .card .label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.05em}
      .card .val{font-size:18px;font-weight:700;margin-top:4px}
      .green{color:#16a34a}.blue{color:#2563eb}.orange{color:#ea580c}.red{color:#dc2626}.purple{color:#7c3aed}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1a1a2e;color:#fff;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #f0f0f0}
      .footer{margin-top:20px;text-align:center;font-size:11px;color:#aaa}
      @media print{@page{margin:10mm}}
    </style></head><body>
    <h1>🔧 Porwal Autoparts — EOD Report</h1>
    <div class="sub">📅 Date: ${date} &nbsp;|&nbsp; Generated: ${new Date().toLocaleTimeString('en-IN')}</div>
    <div class="grid">
      <div class="card"><div class="label">💵 Cash</div><div class="val green">₹${cash.toFixed(0)}</div></div>
      <div class="card"><div class="label">📱 Online</div><div class="val blue">₹${online.toFixed(0)}</div></div>
      <div class="card"><div class="label">📋 Credit</div><div class="val orange">₹${credit.toFixed(0)}</div></div>
      <div class="card"><div class="label">💰 Total Income</div><div class="val green">₹${totalIncome.toFixed(0)}</div></div>
      <div class="card"><div class="label">📈 Gross Profit</div><div class="val blue">₹${profit.toFixed(0)}</div></div>
      <div class="card"><div class="label">🧾 Expenses</div><div class="val red">₹${dayExpenses.toFixed(0)}</div></div>
      <div class="card"><div class="label">✅ Net Profit</div><div class="val ${netProfit >= 0 ? 'green' : 'red'}">₹${netProfit.toFixed(0)}</div></div>
      <div class="card"><div class="label">📦 Items Sold</div><div class="val purple">${itemsSold}</div></div>
      <div class="card"><div class="label">⚠️ Credit Pending</div><div class="val orange">₹${creditPending.toFixed(0)}</div></div>
    </div>
    <table><thead><tr><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">Porwal Autoparts — End of Day Report</div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    win.document.close();
  }

  function shareWhatsApp() {
    const msg = [
      `🔧 *Porwal Autoparts — EOD Report*`,
      `📅 *Date:* ${date}`,
      ``,
      `💵 Cash: ₹${cash.toFixed(0)}`,
      `📱 Online: ₹${online.toFixed(0)}`,
      `📋 Credit: ₹${credit.toFixed(0)}`,
      `💰 *Total Income: ₹${totalIncome.toFixed(0)}*`,
      ``,
      `📈 Gross Profit: ₹${profit.toFixed(0)}`,
      `🧾 Expenses: ₹${dayExpenses.toFixed(0)}`,
      `✅ *Net Profit: ₹${netProfit.toFixed(0)}*`,
      ``,
      `📦 Items Sold: ${itemsSold}`,
      `⚠️ Credit Pending: ₹${creditPending.toFixed(0)}`,
      `🛒 Total Transactions: ${daySales.length}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function copyReport() {
    const text = `Porwal Autoparts EOD ${date}\nCash: ₹${cash.toFixed(0)} | Online: ₹${online.toFixed(0)} | Credit: ₹${credit.toFixed(0)}\nTotal Income: ₹${totalIncome.toFixed(0)} | Net Profit: ₹${netProfit.toFixed(0)}\nItems Sold: ${itemsSold} | Transactions: ${daySales.length}`;
    navigator.clipboard.writeText(text).then(() => toast('Report copy ho gaya!'));
  }

  const stats = [
    { label: '💵 Cash',          val: fmtCurrency(cash),        color: '#16a34a' },
    { label: '📱 Online',        val: fmtCurrency(online),      color: '#2563eb' },
    { label: '📋 Credit',        val: fmtCurrency(credit),      color: '#ea580c' },
    { label: '💰 Total Income',  val: fmtCurrency(totalIncome), color: '#16a34a' },
    { label: '📈 Gross Profit',  val: fmtCurrency(profit),      color: '#2563eb' },
    { label: '🧾 Expenses',      val: fmtCurrency(dayExpenses), color: '#dc2626' },
    { label: '✅ Net Profit',    val: fmtCurrency(netProfit),   color: netProfit >= 0 ? '#16a34a' : '#dc2626' },
    { label: '📦 Items Sold',    val: String(itemsSold),        color: '#7c3aed' },
    { label: '⚠️ Credit Pending', val: fmtCurrency(creditPending), color: '#f97316' },
  ];

  return (
    <div>
      {/* Date picker + actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="gb-input" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: '160px' }} />
        <button className="btn-gray" onClick={load}>↻ Refresh</button>
        <button className="btn-green" onClick={printReport} disabled={loading || !daySales.length}>🖨️ Print / PDF</button>
        <button onClick={shareWhatsApp} disabled={loading || !daySales.length}
          style={{ padding: '8px 16px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!daySales.length) ? .5 : 1 }}>
          📤 WhatsApp Share
        </button>
        <button className="btn-gray" onClick={copyReport} disabled={!daySales.length}>📋 Copy</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div>
      ) : daySales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Is din koi sale nahi</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, marginTop: '6px' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}>
              🛒 {daySales.length} Transactions
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="gb-table">
                <thead><tr><th>Part</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th></tr></thead>
                <tbody>
                  {daySales.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.item_name}</td>
                      <td>{s.qty}</td>
                      <td style={{ fontWeight: 600 }}>{fmtCurrency(Number(s.amount))}</td>
                      <td><span className={`badge badge-${s.payment}`}>{s.payment === 'udhaar' ? 'Credit' : s.payment}</span></td>
                      <td style={{ color: s.customer === 'Walk-in' ? 'var(--text3)' : 'var(--text)' }}>{s.customer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
