import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-6xl">🔧</p>
      <h2 className="text-2xl font-bold text-gray-700">404 — Page nahi mila!</h2>
      <p className="text-gray-500">Ye page exist nahi karta.</p>
      <Link href="/" className="btn">🏠 Dashboard pe Jao</Link>
    </div>
  );
}
