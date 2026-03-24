const SYNC_EVENT = 'gb:sync';

export type SyncChannel = 'inventory' | 'sales' | 'customers' | 'returns';

/** Fire karo jab data change ho */
export function broadcast(channel: SyncChannel) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { channel } }));
}

/** useEffect ke andar call karo — cleanup function return karta hai */
export function listenSync(channels: SyncChannel[], callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const { channel } = (e as CustomEvent<{ channel: SyncChannel }>).detail;
    if (channels.includes(channel)) callback();
  };
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}
