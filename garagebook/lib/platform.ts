// Detect karo ki app Capacitor (native) mein chal raha hai ya browser mein
export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
};

// Native app mein Supabase URL directly use karo
// Web mein /api/* routes use karo
export const apiBase = (): string => {
  if (isNative()) return ''; // direct supabase calls
  return '';                 // relative /api/* routes
};
