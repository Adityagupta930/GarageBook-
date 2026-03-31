const SYNC_EVENT = 'gb:sync';
const BC_NAME    = 'garagebook-sync';

export type SyncChannel = 'inventory' | 'sales' | 'customers' | 'returns';

/** Fire karo jab data change ho — same tab + all other tabs/windows */
export function broadcast(channel: SyncChannel) {
  if (typeof window === 'undefined') return;
  // Same tab
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { channel } }));
  // Other tabs via BroadcastChannel
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({ channel });
    bc.close();
  } catch {}
}

/** useEffect ke andar call karo — cleanup function return karta hai */
export function listenSync(channels: SyncChannel[], callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Same tab listener
  const handler = (e: Event) => {
    const { channel } = (e as CustomEvent<{ channel: SyncChannel }>).detail;
    if (channels.includes(channel)) callback();
  };
  window.addEventListener(SYNC_EVENT, handler);

  // Cross-tab listener
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (e: MessageEvent<{ channel: SyncChannel }>) => {
      if (channels.includes(e.data.channel)) callback();
    };
  } catch {}

  return () => {
    window.removeEventListener(SYNC_EVENT, handler);
    bc?.close();
  };
}
