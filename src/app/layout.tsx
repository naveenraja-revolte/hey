import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: '400',
  variable: '--font-numeric',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Calculator',
  description: 'A simple calculator for everyday arithmetic.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} min-h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-dvh font-sans">{children}</body>
    </html>
  );
}
