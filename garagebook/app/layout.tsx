import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ShellClient from '@/components/ShellClient';
import ToastContainer from '@/components/Toast';
import SwRegister from '@/components/SwRegister';
import { LangProvider } from '@/hooks/useLang';
import { initDb } from '@/lib/db';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'GarageBook — Auto Parts Shop',
  description: 'Auto parts dukaan manager',
};

initDb().catch(console.error);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e94560" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <LangProvider>
          <ShellClient>{children}</ShellClient>
          <ToastContainer />
          <SwRegister />
        </LangProvider>
      </body>
    </html>
  );
}
