// ── Shared (client + server) ─────────────────────────────────────

export const fmtCurrency = (n: number | null | undefined) => `₹${(n ?? 0).toFixed(2)}`;

export const todayStr = () => new Date().toLocaleDateString('en-CA');

/** Format ISO/SQLite datetime string → DD/MM/YYYY */
export const fmtDate = (iso: string) => {
  // SQLite stores as "YYYY-MM-DD HH:MM:SS" — safe to split
  const d = iso.includes('T') ? new Date(iso) : new Date(iso.replace(' ', 'T'));
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ── Server-only ──────────────────────────────────────────────────

export function apiError(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
