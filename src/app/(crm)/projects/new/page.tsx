import { redirect } from 'next/navigation';
import { PageHeading } from '@/app/components/page-heading';
import { ProjectForm } from '@/app/components/project-form';
import { workspaceClientOptions } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

type Props = { searchParams: Promise<{ clientId?: string }> };

export default async function NewProjectPage({ searchParams }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const [clients, params] = await Promise.all([Promise.resolve(workspaceClientOptions(workspace.id)), searchParams]);
  if (clients.length === 0) redirect('/clients/new?returnTo=project');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Add project" description="Connect delivery work to a client and track its budget and deadline." />
      <ProjectForm clients={clients} initialClientId={params.clientId} />
    </div>
  );
}
