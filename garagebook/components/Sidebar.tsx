'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',          icon: '▦',  label: 'Dashboard',  ownerOnly: false },
  { href: '/inventory', icon: '📦', label: 'Products',   ownerOnly: false },
  { href: '/sale',      icon: '🛒', label: 'New Sale',   ownerOnly: false },
  { href: '/bill',      icon: '🧾', label: 'Bill',       ownerOnly: false },
  { href: '/credit',    icon: '📋', label: 'Credit',     ownerOnly: true  },
  { href: '/history',   icon: '🕓', label: 'History',    ownerOnly: true  },
  { href: '/admin',     icon: '📊', label: 'Reports',    ownerOnly: true  },
];

interface Props { onClose?: () => void; isOwner: boolean; }

export default function Sidebar({ onClose, isOwner }: Props) {
  const path = usePathname();
  const visible = links.filter(l => isOwner || !l.ownerOnly);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-row">
          <div className="logo-icon">🔧</div>
          <div>
            <h1>GarageBook</h1>
            <p>Auto Parts Manager</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {visible.map(l => (
          <Link key={l.href} href={l.href}
            onClick={onClose}
            className={`sidebar-link ${path === l.href ? 'active' : ''}`}>
            <span className="icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{isOwner ? 'O' : 'S'}</div>
          <div className="sidebar-user-info">
            <p>{isOwner ? 'Owner' : 'Staff'}</p>
            <span>{isOwner ? 'Full Access' : 'Sales Only'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
