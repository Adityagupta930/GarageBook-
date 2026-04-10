'use client';
import { useEffect, useState, useCallback } from 'react';
import { fmtDate, fmtCurrency } from '@/lib/utils';
import { toast } from '@/components/Toast';
import type { Bill, BillItem } from '@/types';

interface BillWithItems extends Bill { items: BillItem[]; }

export default function BillHistoryPage() {
  const [bills, setBills]       = useState<Bill[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail]     = useState<BillWithItems | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/bills?limit=500').then(r => r.json());
    setBills(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function expand(bill: Bill) {
    if (expanded === bill.id) { setExpanded(null); setDetail(null); return; }
    setExpanded(bill.id);
    const data = await fetch(`/api/bills/${bill.id}`).then(r => r.json());
    setDetail(data);
  }

  async function deleteBill(id: number) {
    if (!confirm('Bill delete karo?')) return;
    await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    toast('Bill delete ho gaya', 'info');
    load();
  }

  function reprintBill(b: BillWithItems) {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = b.items.map(i =>
      `<tr><td>${i.item_name}</td><td>${i.qty}</td><td>₹${Number(i.price).toFixed(2)}</td><td>₹${Number(i.amount).toFixed(2)}</td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${b.bill_no}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#f4f6fb;display:flex;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:16px;padding:28px 24px;width:380px;box-shadow:0 4px 24px rgba(0,0,0,.1)}
    .shop{font-size:20px;font-weight:700;text-align:center}.divider{border:none;border-top:1.5px dashed #dde3f0;margin:14px 0}
    .meta{font-size:12px;color:#555;margin:3px 0}.meta span{font-weight:600;color:#1a1a2e}
    table{width:100%;border-collapse:collapse;margin:10px 0}thead tr{background:#1a1a2e;color:#fff}
    th{padding:7px 8px;font-size:11px;text-align:left}th:last-child,td:last-child{text-align:right}
    td{padding:6px 8px;font-size:12px;border-bottom:1px solid #f0f0f0}
    .grand{display:flex;justify-content:space-between;font-size:16px;font-weight:700;border-top:2px solid #1a1a2e;padding-top:8px;margin-top:6px}
    .footer{text-align:center;font-size:11px;color:#aaa;margin-top:16px}
    @media print{body{background:#fff;padding:0}.card{box-shadow:none;width:100%}@page{margin:8mm}}</style></head><body>
    <div class="card">
      <div class="shop">🔧 Porwal Autoparts</div>
      <div style="text-align:center;font-size:11px;color:#888;margin-bottom:14px">Auto Parts & Garage</div>
      <hr class="divider"/>
      <div class="meta">📋 <span>Bill No:</span> ${b.bill_no}</div>
      <div class="meta">📅 <span>Date:</span> ${fmtDate(b.date)}</div>
      ${b.customer !== 'Walk-in' ? `<div class="meta">👤 <span>Customer:</span> ${b.customer}${b.phone ? ` | 📞 ${b.phone}` : ''}</div>` : ''}
      <hr class="divider"/>
      <table><thead><tr><th>Part</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <hr class="divider"/>
      ${Number(b.discount) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;padding:2px 0"><span>Subtotal</span><span>₹${Number(b.subtotal).toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;font-size:12px;color:#e94560;padding:2px 0"><span>Discount</span><span>-₹${Number(b.discount).toFixed(2)}</span></div>` : ''}
      <div class="grand"><span>TOTAL</span><span>₹${Number(b.total).toFixed(2)}</span></div>
      ${Number(b.balance) > 0 ? `<div style="font-size:13px;color:#e65100;font-weight:600;margin-top:8px">Balance Due: ₹${Number(b.balance).toFixed(2)}</div>` : ''}
      <div class="footer">Thank you for your business! 🙏</div>
    </div>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  }

  const filtered = bills.filter(b =>
    b.bill_no.toLowerCase().includes(search.toLowerCase()) ||
    b.customer.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="gb-input" placeholder="🔍 Bill no / Customer / Phone..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
        <button className="btn-gray" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Koi bill nahi mila</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(b => (
            <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap' }}
                onClick={() => expand(b)}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: '90px' }}>{b.bill_no}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{b.customer}</span>
                {b.phone && <span style={{ fontSize: '12px', color: 'var(--text2)' }}>📞 {b.phone}</span>}
                <span className={`badge badge-${b.payment}`}>{b.payment === 'udhaar' ? 'Credit' : b.payment}</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{fmtCurrency(Number(b.total))}</span>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtDate(b.date)}</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{expanded === b.id ? '▲' : '▼'}</span>
              </div>

              {expanded === b.id && detail?.id === b.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                  <table className="gb-table mb-3">
                    <thead><tr><th>Part</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                    <tbody>
                      {detail.items.map(i => (
                        <tr key={i.id}>
                          <td>{i.item_name}</td>
                          <td>{i.qty}</td>
                          <td>₹{Number(i.price).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>₹{Number(i.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Number(b.balance) > 0 && (
                    <div style={{ fontSize: '13px', color: '#e65100', fontWeight: 600, marginBottom: '10px' }}>
                      ⚠️ Balance Due: {fmtCurrency(Number(b.balance))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-green" onClick={() => reprintBill(detail)}>🖨️ Reprint</button>
                    <button className="btn" style={{ background: '#dc2626' }} onClick={() => deleteBill(b.id)}>🗑️ Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
