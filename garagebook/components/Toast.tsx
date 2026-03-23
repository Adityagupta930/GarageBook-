'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';
const TOAST_EVENT = 'gb:toast';
const DURATION    = 3200;

export function toast(msg: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { msg, type } }));
}

const colors: Record<ToastType, string> = {
  success: '#16a34a',
  error:   '#dc2626',
  info:    '#2563eb',
};
const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

interface ToastItem { id: number; msg: string; type: ToastType; }

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type } = (e as CustomEvent).detail;
      const id = Date.now();
      setToasts(p => [...p.slice(-4), { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), DURATION);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <div className="toast-wrap" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className="toast-item animate-slide-in"
          style={{ background: colors[t.type], cursor: 'pointer', paddingBottom: '14px' }}
          onClick={() => dismiss(t.id)}
          role="alert"
          aria-live="polite">
          <span style={{ marginRight: '6px', fontWeight: 700 }}>{icons[t.type]}</span>
          {t.msg}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            height: '3px', background: 'rgba(255,255,255,0.4)',
            borderRadius: '0 0 8px 8px',
            animation: `toast-progress ${DURATION}ms linear forwards`,
          }} />
        </div>
      ))}
    </div>
  );
}
