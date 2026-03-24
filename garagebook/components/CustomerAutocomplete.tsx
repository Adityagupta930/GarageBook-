'use client';
import { useEffect, useState, useRef } from 'react';
import type { Customer } from '@/types';

interface Props {
  value: string;
  onChange: (name: string, phone?: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CustomerAutocomplete({ value, onChange, placeholder, required }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [show, setShow]           = useState(false);
  const ref                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCustomers(d);
    }).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = value.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()) || c.phone?.includes(value))
    : customers.slice(0, 6);

  function select(c: Customer) {
    onChange(c.name, c.phone || '');
    setShow(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
      <input
        className="gb-input w-full"
        placeholder={placeholder ?? 'Customer naam'}
        value={value}
        onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        autoComplete="off"
        required={required}
      />
      {show && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '8px', boxShadow: 'var(--shadow-md)',
          maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
        }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => select(c)}
              style={{
                padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 500 }}>👤 {c.name}</span>
              {c.phone && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{c.phone}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
