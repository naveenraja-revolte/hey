import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Fieldnotes — a board for the work you carry',
    template: '%s · Fieldnotes',
  },
  description: 'A calm, private board for capturing tasks and moving your projects forward.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
