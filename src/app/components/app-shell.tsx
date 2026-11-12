'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { selectWorkspaceAction } from '@/app/actions/workspaces';

type Workspace = { id: string; name: string };

type AppShellProps = {
  accountName: string;
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  children: React.ReactNode;
};

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/clients', label: 'Clients' },
  { href: '/leads', label: 'Leads' },
  { href: '/projects', label: 'Projects' },
  { href: '/workspaces', label: 'Workspaces' },
];

export function AppShell({ accountName, workspaces, selectedWorkspaceId, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#main-content" className="sr-only z-50 rounded-control bg-card p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <aside className="hidden border-r border-border bg-card px-4 py-6 lg:flex lg:flex-col">
        <Link href="/dashboard" className="px-3 font-heading text-xl font-bold tracking-tight">ClientNest</Link>
        <WorkspacePicker idPrefix="desktop" workspaces={workspaces} selectedWorkspaceId={selectedWorkspaceId} />
        <nav aria-label="Main navigation" className="mt-8 grid gap-1">
          {links.map((link) => <NavigationLink key={link.href} link={link} pathname={pathname} />)}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <p className="truncate px-3 text-sm text-muted-foreground">{accountName}</p>
          <form action={logoutAction} className="mt-2">
            <button className="min-h-11 w-full rounded-control px-3 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="font-heading text-lg font-bold tracking-tight lg:hidden">ClientNest</Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{accountName}</span>
            <form action={logoutAction} className="lg:hidden">
              <button className="min-h-11 rounded-control px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Sign out</button>
            </form>
          </div>
        </header>
        <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
          <WorkspacePicker idPrefix="mobile" workspaces={workspaces} selectedWorkspaceId={selectedWorkspaceId} />
          <details className="mt-3">
            <summary className="min-h-11 cursor-pointer content-center rounded-control px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">Menu</summary>
            <nav aria-label="Main navigation" className="mt-2 grid gap-1">
              {links.map((link) => <NavigationLink key={link.href} link={link} pathname={pathname} />)}
            </nav>
          </details>
        </div>
        <main id="main-content" className="mx-auto w-full max-w-screen-xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavigationLink({ link, pathname }: { link: (typeof links)[number]; pathname: string }) {
  const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(`${link.href}/`));
  return (
    <Link
      href={link.href}
      aria-current={active ? 'page' : undefined}
      className={`min-h-11 rounded-control border-l-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      {link.label}
    </Link>
  );
}

function WorkspacePicker({ idPrefix, workspaces, selectedWorkspaceId }: Omit<AppShellProps, 'accountName' | 'children'> & { idPrefix: string }) {
  return (
    <form action={selectWorkspaceAction} className="mt-6 grid gap-2 px-2 lg:px-1">
      <label htmlFor={`${idPrefix}-active-workspace` className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace</label>
      <select
        id={`${idPrefix}-active-workspace`
        name="workspaceId"
        defaultValue={selectedWorkspaceId}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        disabled={workspaces.length === 0}
      >
        {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
      </select>
      <button disabled={workspaces.length === 0} className="min-h-11 rounded-control border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">Switch workspace</button>
    </form>
  );
}
