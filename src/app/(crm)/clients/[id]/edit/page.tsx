import { notFound, redirect } from 'next/navigation';
import { ClientForm } from '@/app/components/client-form';
import { PageHeading } from '@/app/components/page-heading';
import { getClientDetails } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const { id } = await params;
  const details = getClientDetails(workspace.id, id);
  if (!details) notFound();
  const { client } = details;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Edit client" description={`Update contact details for ${client.name}.`} />
      <ClientForm client={{
        id: client.id,
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        company: client.company ?? '',
        notes: client.notes ?? '',
      }} />
    </div>
  );
}
