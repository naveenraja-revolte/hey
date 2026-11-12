import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily Ledger — everyday spending, kept simple',
  description:
    'A private, local expense ledger for keeping everyday spending and a monthly limit in view.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
