'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',          icon: '⊞',  label: 'Dashboard' },
  { href: '/inventory', icon: '📦', label: 'Products' },
  { href: '/sale',      icon: '🛒', label: 'New Sale' },
  { href: '/bill',      icon: '🧾', label: 'Bill' },
  { href: '/credit',    icon: '📋', label: 'Credit' },
  { href: '/history',   icon: '🕓', label: 'History' },
  { href: '/admin',     icon: '📊', label: 'Reports' },
];

interface Props { onClose?: () => void; }

export default function Sidebar({ onClose }: Props) {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🔧 GarageBook</h1>
        <p>Auto Parts Manager</p>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            onClick={onClose}
            className={`sidebar-link ${path === l.href ? 'active' : ''}`}>
            <span className="icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p style={{ fontSize: '11px', color: 'var(--sidebar-t)', textAlign: 'center' }}>
          GarageBook v2.0
        </p>
      </div>
    </aside>
  );
}
