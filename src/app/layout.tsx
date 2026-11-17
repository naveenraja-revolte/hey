import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const displayFont = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
});

const bodyFont = IBM_Plex_Sans({
  variable: '--font-body',
  subsets: ['latin'],
});

const numberFont = IBM_Plex_Mono({
  variable: '--font-numbers',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Calculator',
  description: 'A simple calculator for everyday arithmetic.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${numberFont.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">{children}</body>
    </html>
  );
}
