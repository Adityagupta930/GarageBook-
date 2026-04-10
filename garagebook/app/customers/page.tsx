'use client';
import { useEffect, useState, useCallback } from 'react';
import { fmtDate, fmtCurrency } from '@/lib/utils';
import { toast } from '@/components/Toast';
import type { Sale } from '@/types';

interface CustomerLedger {
  name: string;
  phone: string;
  totalBought: number;
  totalPaid: number;
  totalCredit: number;
  creditPending: number;
  sales: Sale[];
}

export default function CustomerLedgerPage() {
  const [ledgers, setLedgers]   = useState<CustomerLedger[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data: Sale[] = await fetch('/api/sales?limit=2000').then(r => r.json());
    if (!Array.isArray(data)) { setLoading(false); return; }

    const map: Record<string, CustomerLedger> = {};
    data.filter(s => s.customer && s.customer !== 'Walk-in').forEach(s => {
      if (!map[s.customer]) map[s.customer] = {
        name: s.customer, phone: s.phone || '',
        totalBought: 0, totalPaid: 0, totalCredit: 0, creditPending: 0, sales: [],
      };
      const l = map[s.customer];
      l.sales.push(s);
      l.totalBought += Number(s.amount);
      if (s.payment !== 'udhaar') l.totalPaid += Number(s.amount);
      if (s.payment === 'udhaar') {
        l.totalCredit += Number(s.amount);
        if (!s.udhaar_paid) l.creditPending += Number(s.amount);
      }
    });

    setLedgers(Object.values(map).sort((a, b) => b.creditPending - a.creditPending));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markPaid(saleId: number) {
    await fetch(`/api/sales/${saleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ udhaar_paid: true }) });
    toast('Paid mark ho gaya!');
    load();
  }

  const filtered = ledgers.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="gb-input" placeholder="🔍 Customer naam / phone..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
        <button className="btn-gray" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Koi customer nahi mila</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(l => (
            <div key={l.name} style={{ background: 'var(--surface)', border: `1px solid ${l.creditPending > 0 ? '#f97316' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap' }}
                onClick={() => setExpanded(expanded === l.name ? null : l.name)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  {l.phone && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>📞 {l.phone}</div>}
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text2)' }}>
                  <div>Total: <b style={{ color: 'var(--text)' }}>{fmtCurrency(l.totalBought)}</b></div>
                  <div>{l.sales.length} transactions</div>
                </div>
                {l.creditPending > 0 && (
                  <div style={{ background: 'rgba(249,115,22,.15)', color: '#f97316', border: '1px solid rgba(249,115,22,.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 700 }}>
                    ⚠️ {fmtCurrency(l.creditPending)} pending
                  </div>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{expanded === l.name ? '▲' : '▼'}</span>
              </div>

              {expanded === l.name && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                  {/* Summary strip */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px', fontSize: '13px' }}>
                    <span>💵 Cash/Online: <b style={{ color: '#16a34a' }}>{fmtCurrency(l.totalPaid)}</b></span>
                    <span>📋 Credit Total: <b style={{ color: '#ea580c' }}>{fmtCurrency(l.totalCredit)}</b></span>
                    {l.creditPending > 0 && <span>⚠️ Pending: <b style={{ color: '#dc2626' }}>{fmtCurrency(l.creditPending)}</b></span>}
                  </div>

                  <table className="gb-table">
                    <thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {l.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                        <tr key={s.id}>
                          <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtDate(s.date)}</td>
                          <td>{s.item_name}</td>
                          <td>{s.qty}</td>
                          <td style={{ fontWeight: 600 }}>{fmtCurrency(Number(s.amount))}</td>
                          <td><span className={`badge badge-${s.payment}`}>{s.payment === 'udhaar' ? 'Credit' : s.payment}</span></td>
                          <td>
                            {s.payment === 'udhaar' ? (
                              s.udhaar_paid
                                ? <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>✅ Paid</span>
                                : <button className="btn" style={{ padding: '3px 10px', fontSize: '11px', background: '#16a34a' }} onClick={() => markPaid(s.id)}>Mark Paid</button>
                            ) : <span style={{ color: 'var(--text3)', fontSize: '12px' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
