import type { ReactNode } from 'react';
import { AppShell } from '@/app/components/app-shell';
import { requireAccount } from '@/lib/session';
import { currentWorkspace } from '@/lib/session';
import { listWorkspaces } from '@/lib/workspace-service';

export default async function CrmLayout({ children }: Readonly<{ children: ReactNode }>) {
  const account = await requireAccount();
  const [workspaces, workspace] = await Promise.all([
    Promise.resolve(listWorkspaces(account.id)),
    currentWorkspace(account.id),
  ]);

  return (
    <AppShell
      accountName={account.name}
      workspaces={workspaces}
      selectedWorkspaceId={workspace?.id ?? ''}
    >
      {children}
    </AppShell>
  );
}
