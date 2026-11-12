import { notFound, redirect } from 'next/navigation';
import { LeadForm } from '@/app/components/lead-form';
import { PageHeading } from '@/app/components/page-heading';
import type { LeadStatus } from '@/lib/domain';
import { getLead } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

type Props = { params: Promise<{ id: string }> };

export default async function EditLeadPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const lead = getLead(workspace.id, id);
  if (!lead || lead.status === 'Converted') notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Edit lead" description={`Update the prospect details and status for ${lead.name}.`} />
      <LeadForm lead={{
        id: lead.id,
        name: lead.name,
        email: lead.email ?? '',
        phone: lead.phone ?? '',
        company: lead.company ?? '',
        notes: lead.notes ?? '',
        source: lead.source,
        status: lead.status as LeadStatus,
      }} />
    </div>
  );
}
