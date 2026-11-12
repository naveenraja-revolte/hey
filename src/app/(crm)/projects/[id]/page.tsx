import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { PageHeading } from '@/app/components/page-heading';
import { StatusBadge } from '@/app/components/status-badge';
import { deleteProjectAction } from '@/app/actions/crm';
import { getProject } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailsPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const result = getProject(workspace.id, id);
  if (!result) notFound();
  const { project, clientName } = result;
  const overdue = Boolean(project.deadline && project.deadline < new Date().toISOString().slice(0, 10) && !['Completed', 'Cancelled'].includes(project.status));

  return (
    <div className="space-y-7">
      <PageHeading title={project.name} description={clientName} action={{ href: `/projects/${project.id}/edit`, label: 'Edit project' }} />
      <section className="grid gap-6 rounded-container border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
        <Info label="Status" value={<StatusBadge status={project.status} />} />
        <Info label="Budget" value={project.budgetCents === null ? 'Not set' : currency.format(project.budgetCents / 100)} />
        <Info label="Deadline" value={project.deadline ? <span className={overdue ? 'font-semibold text-destructive' : ''}>{dateFormat.format(new Date(`${project.deadline}T12:00:00`))}{overdue ? ' · Overdue' : ''}</span> : 'Not set'} />
        <Info label="Client" value={<Link href={`/clients/${project.clientId}`} className="font-semibold text-primary underline-offset-4 hover:underline">{clientName}</Link>} />
        <div className="sm:col-span-2"><Info label="Description" value={project.description || 'No description provided.'} /></div>
      </section>
      <div className="border-t border-border pt-4">
        <ConfirmDelete id={project.id} name={project.name} action={deleteProjectAction} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
      <div className="mt-2 text-sm leading-6">{value}</div>
    </div>
  );
}
