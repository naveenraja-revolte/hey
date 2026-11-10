import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { requireWorkspaceViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const viewer = await requireWorkspaceViewer();

  return (
    <div className="workspace-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/tickets">
          <span aria-hidden="true" className="brand-mark">D</span>
          <span>Dispatch Desk</span>
        </Link>
        <nav aria-label="Main navigation" className="topbar-nav">
          <Link className="nav-link" href="/tickets">Queue</Link>
          {viewer.role === 'admin' && <Link className="nav-link" href="/admin">Administration</Link>}
          <Link className="button button-primary button-small" href="/tickets/new">New ticket</Link>
        </nav>
        <div className="account-menu">
          <span className="account-name">{viewer.name}</span>
          <span className="role-label">{viewer.role === 'admin' ? 'Administrator' : 'Team member'}</span>
          <form action={signOutAction}>
            <button className="text-link" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className="workspace-main">{children}</main>
      <footer className="app-footer">
        <span>Dispatch Desk</span>
        <span>Support work, clearly owned.</span>
      </footer>
    </div>
  );
}
