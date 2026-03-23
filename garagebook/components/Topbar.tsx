'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const titles: Record<string, { label: string; icon: string }> = {
  '/':          { label: 'Dashboard',      icon: '▦'  },
  '/inventory': { label: 'Products',       icon: '📦' },
  '/sale':      { label: 'New Sale',       icon: '🛒' },
  '/bill':      { label: 'Bill',           icon: '🧾' },
  '/credit':    { label: 'Credit Book',    icon: '📋' },
  '/history':   { label: 'Sales History',  icon: '🕓' },
  '/admin':     { label: 'Reports',        icon: '📊' },
};

interface Props { onMenuClick: () => void; }

export default function Topbar({ onMenuClick }: Props) {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const page = titles[path] ?? { label: 'GarageBook', icon: '🔧' };

  useEffect(() => {
    const saved = localStorage.getItem('gb_theme');
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setDark(true); }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('gb_theme', next ? 'dark' : 'light');
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onMenuClick} aria-label="Menu">☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{page.icon}</span>
          <span className="topbar-title">{page.label}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Dark mode */}
        <button className="icon-btn" onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', flexShrink: 0,
        }}>A</div>
      </div>
    </header>
  );
}
