import Link from 'next/link';
import type { ReactNode } from 'react';
import { Navigation } from './navigation';
import { SignOutButton } from './sign-out-button';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        className="rounded-control bg-primary text-primary-foreground sr-only px-4 py-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        href="#main"
      >
        Skip to content
      </a>
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/deliveries"
            className="font-heading text-foreground text-xl font-semibold tracking-tight"
          >
            Dispatch Desk
          </Link>
          <Navigation />
          <SignOutButton />
        </div>
      </header>
      <main id="main" className="page-enter mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}
