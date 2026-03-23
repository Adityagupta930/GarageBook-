'use client';
import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useRole } from '@/hooks/useRole';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useInactivity } from '@/hooks/useInactivity';
import { toast } from '@/components/Toast';

export default function ShellClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { role, setRole, isOwner } = useRole();

  const handleLogout = useCallback(() => {
    toast('⏰ Session expire ho gaya. Role reset.', 'info');
    setRole('staff');
  }, [setRole]);

  useKeyboardShortcuts();
  useInactivity(handleLogout);

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <Sidebar onClose={() => setOpen(false)} isOwner={isOwner} />
      <div className="main-area">
        <Topbar onMenuClick={() => setOpen(o => !o)} role={role} setRole={setRole} isOwner={isOwner} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
