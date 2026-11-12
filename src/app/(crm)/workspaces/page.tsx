import { PageHeading } from '@/app/components/page-heading';
import { WorkspaceDelete } from '@/app/components/workspace-delete';
import { WorkspaceForm } from '@/app/components/workspace-form';
import { currentWorkspace, requireAccount } from '@/lib/session';
import { listWorkspaces } from '@/lib/workspace-service';

type SearchParams = Promise<{ error?: string }>;

export default async function WorkspacesPage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  const [workspaces, active, query] = await Promise.all([
    Promise.resolve(listWorkspaces(account.id)),
    currentWorkspace(account.id),
    searchParams,
  ]);
  const error = query.error === 'workspace-not-empty'
    ? 'This workspace still contains CRM records. It cannot be deleted until those records are removed.'
    : '';

  return (
    <div className="space-y-8">
      <PageHeading title="Workspaces" description="Keep separate businesses or parts of your work private and organized." />
      {error && <p role="alert" className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {active && (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Active workspace</h2>
          <WorkspaceForm mode="rename" currentName={active.name} />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Create a workspace</h2>
        <WorkspaceForm mode="create" />
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Your workspaces</h2>
        {workspaces.length === 0 ? (
          <p className="rounded-container border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Create a workspace to start adding clients, leads, and projects.</p>
        ) : (
          <ul className="divide-y divide-border rounded-container border border-border bg-card">
            {workspaces.map((workspace) => (
              <li key={workspace.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{workspace.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{workspace.id === active?.id ? 'Currently selected' : 'Private to your account'}</p>
                </div>
                <WorkspaceDelete id={workspace.id} name={workspace.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
