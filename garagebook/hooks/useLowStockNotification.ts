'use client';
import { useEffect, useRef } from 'react';

const NOTIF_KEY = 'gb_last_lowstock_notif';
const COOLDOWN  = 1000 * 60 * 60; // 1 hour

export function useLowStockNotification(lowStockItems: { name: string; stock: number }[]) {
  const notified = useRef(false);

  useEffect(() => {
    if (!lowStockItems.length || notified.current) return;

    const last = +(localStorage.getItem(NOTIF_KEY) || 0);
    if (Date.now() - last < COOLDOWN) return;

    async function notify() {
      if (!('Notification' in window)) return;

      let perm = Notification.permission;
      if (perm === 'default') perm = await Notification.requestPermission();
      if (perm !== 'granted') return;

      const names = lowStockItems.slice(0, 3).map(i => `${i.name} (${i.stock} left)`).join(', ');
      const extra = lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : '';

      new Notification('⚠️ Low Stock Alert — Porwal Autoparts', {
        body: `${names}${extra}`,
        icon: '/icon-192.svg',
      });

      localStorage.setItem(NOTIF_KEY, String(Date.now()));
      notified.current = true;
    }

    notify();
  }, [lowStockItems]);
}
