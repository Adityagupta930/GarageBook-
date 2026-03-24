// Events: 'inventory' | 'sales' | 'customers' | 'returns'
const SYNC_EVENT = 'gb:sync';

export type SyncChannel = 'inventory' | 'sales' | 'customers' | 'returns';

/** Fire karo jab data change ho */
export function broadcast(channel: SyncChannel) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { channel } }));
}

/** Listen karo — jab bhi channel ka data change ho, callback chalega */
export function useSyncListener(channels: SyncChannel[], callback: () => void) {
  if (typeof window === 'undefined') return;
  // This is called inside useEffect in components
  const handler = (e: Event) => {
    const { channel } = (e as CustomEvent<{ channel: SyncChannel }>).detail;
    if (channels.includes(channel)) callback();
  };
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}
