'use client';
import { useEffect, useRef } from 'react';
import type { DailyReport, TopPart } from '@/types';

/* ── Bar Chart — Daily Sales ─────────────────────────────────── */
export function DailyBarChart({ data }: { data: DailyReport[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sorted  = [...data].reverse().slice(-30);
    const vals    = sorted.map(d => Number(d.total) || 0);
    const profits = sorted.map(d => Number(d.profit) || 0);
    const labels  = sorted.map(d => d.day.slice(5));
    const max     = Math.max(...vals, 1);

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const padL = 52, padR = 12, padT = 20, padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barW   = Math.max(4, (chartW / sorted.length) - 4);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor   = isDark ? '#8b949e' : '#94a3b8';
    const gridColor   = isDark ? '#30363d' : '#e2e8f0';
    const barColor    = '#e94560';
    const profitColor = '#22c55e';

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const val = max - (max / 4) * i;
      ctx.fillStyle = textColor;
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val.toFixed(0)}`, padL - 4, y + 3);
    }

    // Bars
    sorted.forEach((_, i) => {
      const x    = padL + i * (chartW / sorted.length) + (chartW / sorted.length - barW) / 2;
      const barH = (vals[i] / max) * chartH;
      const profH = (Math.max(0, profits[i]) / max) * chartH;
      const y    = padT + chartH - barH;

      // Revenue bar
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Profit overlay
      if (profH > 0) {
        ctx.fillStyle = profitColor;
        ctx.beginPath();
        ctx.roundRect(x, padT + chartH - profH, barW, profH, [3, 3, 0, 0]);
        ctx.fill();
      }

      // X label
      if (i % Math.ceil(sorted.length / 10) === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barW / 2, H - padB + 14);
      }
    });

    // Legend
    ctx.font = '10px system-ui'; ctx.textAlign = 'left';
    ctx.fillStyle = barColor;    ctx.fillRect(padL, 4, 10, 8);
    ctx.fillStyle = textColor;   ctx.fillText('Revenue', padL + 14, 12);
    ctx.fillStyle = profitColor; ctx.fillRect(padL + 70, 4, 10, 8);
    ctx.fillStyle = textColor;   ctx.fillText('Profit', padL + 84, 12);
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

/* ── Horizontal Bar — Top Parts ──────────────────────────────── */
export function TopPartsChart({ data }: { data: TopPart[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const top  = data.slice(0, 8);
    const maxQ = Math.max(...top.map(d => Number(d.total_qty)), 1);

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = Math.max(top.length * 36 + 20, 100);
    canvas.style.height = `${H}px`;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const isDark    = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#8b949e' : '#64748b';
    const barColor  = '#e94560';
    const padL = 130, padR = 50;

    ctx.clearRect(0, 0, W, H);

    top.forEach((p, i) => {
      const y    = 10 + i * 36;
      const barW = ((Number(p.total_qty) / maxQ) * (W - padL - padR));

      ctx.fillStyle = isDark ? '#30363d' : '#f1f5f9';
      ctx.beginPath(); ctx.roundRect(padL, y + 8, W - padL - padR, 18, 4); ctx.fill();

      ctx.fillStyle = barColor;
      ctx.beginPath(); ctx.roundRect(padL, y + 8, barW, 18, 4); ctx.fill();

      ctx.fillStyle = textColor; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(p.item_name.length > 16 ? p.item_name.slice(0, 15) + '…' : p.item_name, padL - 6, y + 21);

      ctx.fillStyle = isDark ? '#e6edf3' : '#0f172a'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
      ctx.fillText(`×${p.total_qty}`, padL + barW + 6, y + 21);
    });
  }, [data]);

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%' }} />
    </div>
  );
}

/* ── Mini Sparkline ──────────────────────────────────────────── */
export function Sparkline({ data, color = '#e94560' }: { data: number[]; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const min = Math.min(...data), max = Math.max(...data, min + 1);
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / (max - min)) * H * 0.8 - H * 0.1,
    }));

    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  }, [data, color]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
