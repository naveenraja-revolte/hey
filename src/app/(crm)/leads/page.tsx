import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { DataToolbar } from '@/app/components/data-toolbar';
import { PageHeading } from '@/app/components/page-heading';
import { Pagination } from '@/app/components/pagination';
import { StatusBadge } from '@/app/components/status-badge';
import { SubmitButton } from '@/app/components/submit-button';
import { convertLeadAction, deleteLeadAction } from '@/app/actions/crm';
import { leadStatuses } from '@/lib/domain';
import { listLeads } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';
import { flatQuery, queryPage, queryValue, type QueryValues } from '@/lib/url-state';

const statuses = leadStatuses.map((status) => ({ value: status, label: status }));
const sorts = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
];

type Props = { searchParams: Promise<QueryValues> };

export default async function LeadsPage({ searchParams }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const params = await searchParams;
  const query = queryValue(params, 'q');
  const status = queryValue(params, 'status');
  const sort = queryValue(params, 'sort') || 'updated';
  const result = listLeads(workspace.id, { q: query, status, sort, page: queryPage(params) });
  const hasFilters = Boolean(query || status);
  const error = queryValue(params, 'error');

  return (
    <div className="space-y-6">
      <PageHeading title="Leads" description="Track prospects from first contact through a decision." action={{ href: '/leads/new', label: 'Add lead' }} />
      {error && <p role="alert" className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <DataToolbar query={query} status={status} statusOptions={statuses} sort={sort} sortOptions={sorts} />
      {result.total === 0 ? (
        <p className="rounded-container border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {hasFilters ? <>No leads match these filters. <Link href="/leads" className="font-semibold text-primary underline">Clear filters</Link></> : 'No leads yet. Add a prospect to start tracking the conversation.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-container border border-border bg-card" tabIndex={0} aria-label="Leads table, horizontally scrollable">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <caption className="sr-only">Lead records</caption>
              <thead className="bg-muted/60 text-muted-foreground">
                <tr><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Company</th><th scope="col" className="p-3">Source</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {result.items.map((lead) => (
                  <tr key={lead.id} className="border-t border-border">
                    <th scope="row" className="p-3 font-semibold"><Link href={`/leads/${lead.id}`} className="underline-offset-4 hover:text-primary hover:underline">{lead.name}</Link></th>
                    <td className="p-3">{lead.company ?? '—'}</td>
                    <td className="p-3">{lead.source}</td>
                    <td className="p-3"><StatusBadge status={lead.status} /></td>
                    <td className="flex flex-wrap items-center gap-2 p-3">
                      {lead.clientId ? (
                        <Link href={`/clients/${lead.clientId}`} className="min-h-11 content-center font-semibold text-primary hover:underline">View client</Link>
                      ) : lead.status !== 'Lost' ? (
                        <form action={convertLeadAction}>
                          <input type="hidden" name="id" value={lead.id} />
                          <SubmitButton pendingLabel="Converting…" variant="secondary">Convert</SubmitButton>
                        </form>
                      ) : null}
                      {lead.status !== 'Converted' && <Link href={`/leads/${lead.id}/edit`} className="min-h-11 content-center font-semibold text-primary hover:underline">Edit</Link>}
                      <ConfirmDelete id={lead.id} name={lead.name} action={deleteLeadAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination result={result} searchParams={flatQuery(params)} />
        </div>
      )}
    </div>
  );
}
