import { notFound, redirect } from 'next/navigation';
import { PageHeading } from '@/app/components/page-heading';
import { ProjectForm } from '@/app/components/project-form';
import type { ProjectStatus } from '@/lib/domain';
import { getProject, workspaceClientOptions } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const [result, clients] = [getProject(workspace.id, id), workspaceClientOptions(workspace.id)];
  if (!result) notFound();
  const { project, clientName: _clientName } = result;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Edit project" description={`Update project details for ${project.name}.`} />
      <ProjectForm clients={clients} project={{
        id: project.id,
        name: project.name,
        clientId: project.clientId,
        description: project.description ?? '',
        budget: project.budgetCents == null ? '' : (project.budgetCents / 100).toFixed(2),
        budgetCents: project.budgetCents,
        deadline: project.deadline ?? '',
        status: project.status as ProjectStatus,
      }} />
    </div>
  );
}
