import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { PageHeading } from '@/app/components/page-heading';
import { StatusBadge } from '@/app/components/status-badge';
import { SubmitButton } from '@/app/components/submit-button';
import { convertLeadAction, deleteLeadAction } from '@/app/actions/crm';
import { getLead } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailsPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const lead = getLead(workspace.id, id);
  if (!lead) notFound();

  return (
    <div className="space-y-7">
      <PageHeading
        title={lead.name}
        description={lead.company ?? `Lead from ${lead.source}`}
        action={lead.status === 'Converted' ? undefined : { href: `/leads/${lead.id}/edit`, label: 'Edit lead' }}
      />
      <section className="grid gap-6 rounded-container border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
        <Info label="Status" value={<StatusBadge status={lead.status} />} />
        <Info label="Source" value={lead.source} />
        <Info label="Email" value={lead.email ?? 'Not provided'} />
        <Info label="Phone" value={lead.phone ?? 'Not provided'} />
        <Info label="Company" value={lead.company ?? 'Not provided'} />
        <Info label="Added" value={dateFormat.format(new Date(lead.createdAt))} />
        <div className="sm:col-span-2"><Info label="Notes" value={lead.notes ?? 'No notes provided.'} /></div>
        {lead.clientId && (
          <div className="sm:col-span-2">
            <Info label="Converted client" value={<Link href={`/clients/${lead.clientId}`} className="font-semibold text-primary underline-offset-4 hover:underline">View client</Link>} />
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {lead.status !== 'Converted' && lead.status !== 'Lost' ? (
          <form action={convertLeadAction}>
            <input type="hidden" name="id" value={lead.id} />
            <SubmitButton pendingLabel="Converting…">Convert to client</SubmitButton>
          </form>
        ) : <span />}
        <ConfirmDelete id={lead.id} name={lead.name} action={deleteLeadAction} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6">{value}</div>
    </div>
  );
}
