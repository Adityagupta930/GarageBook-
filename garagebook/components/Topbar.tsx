'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Role } from '@/hooks/useRole';
import { useLang } from '@/hooks/useLang';
import type { InventoryItem } from '@/types';

const titles: Record<string, { label: string; icon: string }> = {
  '/':          { label: 'Dashboard',     icon: '▦'  },
  '/inventory': { label: 'Products',      icon: '📦' },
  '/sale':      { label: 'New Sale',      icon: '🛒' },
  '/bill':      { label: 'Bill',          icon: '🧾' },
  '/credit':    { label: 'Credit Book',   icon: '📋' },
  '/history':   { label: 'Sales History', icon: '🕓' },
  '/admin':     { label: 'Reports',       icon: '📊' },
};

interface Props {
  onMenuClick: () => void;
  role: Role;
  setRole: (r: Role) => void;
  isOwner: boolean;
}

export default function Topbar({ onMenuClick, role, setRole, isOwner }: Props) {
  const path = usePathname();
  const [dark, setDark]           = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [lowItems, setLowItems]   = useState<InventoryItem[]>([]);
  const [online, setOnline]       = useState(true);
  const { lang, setLang, t }      = useLang();
  const page = titles[path] ?? { label: 'GarageBook', icon: '🔧' };

  useEffect(() => {
    const saved = localStorage.getItem('gb_theme');
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setDark(true); }
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Load low-stock items for alert bell
  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then((data: InventoryItem[]) => {
        if (Array.isArray(data))
          setLowItems(data.filter(i => Number(i.stock) <= 5 && Number(i.stock) >= 0));
      })
      .catch(() => {});
  }, [path]); // refresh on page change

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('gb_theme', next ? 'dark' : 'light');
  }

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="topbar-left">
        <button className="hamburger" onClick={onMenuClick} aria-label="Menu">☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{page.icon}</span>
          <span className="topbar-title">{page.label}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Keyboard shortcut hint */}
        <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'none' }} className="kb-hint">
          Ctrl+S Sale · Ctrl+I Inventory
        </span>

        {/* Online/Offline indicator */}
        <span title={online ? 'Online' : 'Offline — sales queue mein jayenge'} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: online ? '#22c55e' : '#ef4444',
          display: 'inline-block', flexShrink: 0,
          boxShadow: online ? '0 0 0 2px rgba(34,197,94,.25)' : '0 0 0 2px rgba(239,68,68,.25)',
        }} />

        {/* Smart Alert Bell */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setAlertOpen(o => !o)}
            title={`${lowItems.length} low stock alerts`}
            style={{ position: 'relative' }}>
            🔔
            {lowItems.length > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#ef4444', color: '#fff',
                fontSize: '9px', fontWeight: 700,
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>{lowItems.length > 9 ? '9+' : lowItems.length}</span>
            )}
          </button>

          {alertOpen && (
            <div style={{
              position: 'absolute', top: '42px', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: 'var(--shadow-md)',
              width: '260px', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, color: 'var(--text2)' }}>
                ⚠️ {t.stockAlert} ({lowItems.length})
              </div>
              {lowItems.length === 0 ? (
                <div style={{ padding: '14px', fontSize: '13px', color: 'var(--text3)', textAlign: 'center' }}>
                  ✅ {t.allGood}
                </div>
              ) : (
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {lowItems.map(i => (
                    <div key={i.id} style={{
                      padding: '8px 14px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: 'var(--text)' }}>{i.name}</span>
                      <span style={{
                        fontWeight: 700, fontSize: '12px',
                        color: i.stock === 0 ? '#ef4444' : '#f97316',
                      }}>
                        {i.stock === 0 ? '❌ OUT' : `⚠️ ${i.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lang toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="icon-btn"
          title={lang === 'en' ? 'Hindi mein switch karo' : 'Switch to English'}
          style={{ fontSize: '12px', fontWeight: 700, width: 'auto', padding: '0 8px' }}>
          {lang === 'en' ? 'हि' : 'EN'}
        </button>

        {/* Role Switcher */}
        <select
          value={role}
          onChange={e => setRole(e.target.value as Role)}
          style={{
            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
            border: '1px solid var(--border)', background: isOwner ? 'rgba(233,69,96,.1)' : 'var(--surface2)',
            color: isOwner ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', outline: 'none',
          }}
          title="Switch role">
          <option value="owner">👑 {t.owner}</option>
          <option value="staff">👤 {t.staff}</option>
        </select>

        {/* Dark mode */}
        <button className="icon-btn" onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: isOwner ? 'var(--primary)' : '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', flexShrink: 0,
          transition: 'background .2s',
        }} title={isOwner ? 'Owner' : 'Staff'}>
          {isOwner ? 'O' : 'S'}
        </div>
      </div>

      {/* Click outside to close alert */}
      {alertOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setAlertOpen(false)} />
      )}
    </header>
  );
}
