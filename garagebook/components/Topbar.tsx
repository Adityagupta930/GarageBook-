'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLang } from '@/hooks/useLang';
import type { InventoryItem, Sale, Bill } from '@/types';
import InstallButton from '@/components/InstallButton';

type SearchResult = { type: 'part' | 'sale' | 'bill'; label: string; sub: string; href: string; };

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
  isOwner: boolean;
  userName: string;
  onLogout: () => void;
}

export default function Topbar({ onMenuClick, isOwner, userName, onLogout }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [dark, setDark]           = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [lowItems, setLowItems]   = useState<InventoryItem[]>([]);
  const [online, setOnline]       = useState(true);
  const { lang, setLang, t }      = useLang();
  const page = titles[path] ?? { label: 'Porwal Autoparts', icon: '🔧' };

  // Global Search
  const [searchQ, setSearchQ]         = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const searchRef                     = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const ql = q.toLowerCase();
    const [parts, sales, bills] = await Promise.all([
      fetch('/api/inventory').then(r => r.json()).catch(() => []),
      fetch('/api/sales?limit=200').then(r => r.json()).catch(() => []),
      fetch('/api/bills?limit=200').then(r => r.json()).catch(() => []),
    ]);
    const results: SearchResult[] = [];
    if (Array.isArray(parts))
      (parts as InventoryItem[]).filter(p => p.name.toLowerCase().includes(ql) || p.company?.toLowerCase().includes(ql))
        .slice(0, 3).forEach(p => results.push({ type: 'part', label: p.name, sub: `Stock: ${p.stock} · ₹${p.price}`, href: '/inventory' }));
    if (Array.isArray(sales))
      (sales as Sale[]).filter(s => s.item_name.toLowerCase().includes(ql) || s.customer.toLowerCase().includes(ql))
        .slice(0, 3).forEach(s => results.push({ type: 'sale', label: s.item_name, sub: `${s.customer} · ₹${s.amount}`, href: '/history' }));
    if (Array.isArray(bills))
      (bills as Bill[]).filter(b => b.bill_no.toLowerCase().includes(ql) || b.customer.toLowerCase().includes(ql))
        .slice(0, 3).forEach(b => results.push({ type: 'bill', label: b.bill_no, sub: `${b.customer} · ₹${b.total}`, href: '/bills' }));
    setSearchResults(results);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ, doSearch]);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
        {/* Global Search */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" title="Global Search (Ctrl+K)"
            onClick={() => { setSearchOpen(o => !o); setTimeout(() => searchRef.current?.focus(), 50); }}
            style={{ fontSize: '14px' }}>🔍</button>

          {searchOpen && (
            <div style={{
              position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
              width: '480px', maxWidth: '95vw',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,.3)', zIndex: 200,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <input ref={searchRef} className="gb-input" placeholder="Parts, customers, bills search karo..."
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>ESC</span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {searching ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Searching...</div>
                ) : searchResults.length === 0 && searchQ ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Koi result nahi mila</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Parts, customers, bills type karo...</div>
                ) : (
                  searchResults.map((r, i) => (
                    <div key={i}
                      onClick={() => { router.push(r.href); setSearchOpen(false); setSearchQ(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontSize: '16px' }}>
                        {r.type === 'part' ? '📦' : r.type === 'sale' ? '🛒' : '🧾'}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{r.sub}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.type === 'part' ? 'Inventory' : r.type === 'sale' ? 'History' : 'Bills'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {searchOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setSearchOpen(false)} />}
        </div>
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

        {/* Install App Button */}
        <InstallButton />

        {/* Lang toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="icon-btn"
          title={lang === 'en' ? 'Hindi mein switch karo' : 'Switch to English'}
          style={{ fontSize: '12px', fontWeight: 700, width: 'auto', padding: '0 8px' }}>
          {lang === 'en' ? 'हि' : 'EN'}
        </button>

        {/* Role Badge */}
        <span style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
            background: isOwner ? 'rgba(233,69,96,.1)' : 'var(--surface2)',
            color: isOwner ? 'var(--primary)' : 'var(--text2)',
          }}>
          {isOwner ? `👑 ${userName.split(' ')[0] || 'Owner'}` : '👤 Staff'}
        </span>

        {/* Dark mode */}
        <button className="icon-btn" onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

        {/* Logout */}
        <button
          onClick={onLogout}
          className="icon-btn"
          title="Logout"
          style={{ fontSize: '14px' }}>
          🚪
        </button>
      </div>

      {/* Click outside to close alert */}
      {alertOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setAlertOpen(false)} />
      )}
    </header>
  );
}
