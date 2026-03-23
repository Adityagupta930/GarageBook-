export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export const fmtCurrency = (n: number) => `₹${n.toFixed(2)}`;

export const todayStr = () => new Date().toLocaleDateString('en-CA');

export function apiError(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}
