import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { PageHeading } from '@/app/components/page-heading';
import { StatusBadge } from '@/app/components/status-badge';
import { deleteClientAction } from '@/app/actions/crm';
import { getClientDetails } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailsPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const details = getClientDetails(workspace.id, id);
  if (!details) notFound();
  const { client, projects } = details;

  return (
    <div className="space-y-7">
      <PageHeading title={client.name} description={client.company ?? 'Client record'} action={{ href: `/clients/${client.id}/edit`, label: 'Edit client' }} />
      <section className="grid gap-6 rounded-container border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
        <Info label="Email" value={client.email} />
        <Info label="Phone" value={client.phone} />
        <Info label="Company" value={client.company} />
        <Info label="Added" value={dateFormat.format(new Date(client.createdAt))} />
        <div className="sm:col-span-2"><Info label="Notes" value={client.notes} /></div>
      </section>
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Projects</h2>
          <Link href={`/projects/new?clientId=${client.id}`} className="min-h-11 content-center font-semibold text-primary underline-offset-4 hover:underline">Add project</Link>
        </header>
        {projects.length === 0 ? (
          <p className="rounded-container border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No projects are linked to this client yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-container border border-border bg-card">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/projects/${project.id}`} className="font-semibold hover:text-primary">{project.name}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.deadline ? `Due ${dateFormat.format(new Date(`${project.deadline}T12:00:00`))}` : 'No deadline'}
                    {project.budgetCents !== null ? ` · ${currency.format(project.budgetCents / 100)}` : ''}
                  </p>
                </div>
                <StatusBadge status={project.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="border-t border-border pt-4">
        <ConfirmDelete id={client.id} name={client.name} action={deleteClientAction} description="This client cannot be deleted while projects are linked to it." />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || 'Not provided'}</p>
    </div>
  );
}
