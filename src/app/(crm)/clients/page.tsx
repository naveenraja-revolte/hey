import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { DataToolbar } from '@/app/components/data-toolbar';
import { PageHeading } from '@/app/components/page-heading';
import { Pagination } from '@/app/components/pagination';
import { deleteClientAction } from '@/app/actions/crm';
import { listClients } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';
import { flatQuery, queryPage, queryValue, type QueryValues } from '@/lib/url-state';

const relationOptions = [
  { value: '', label: 'Any clients' },
  { value: 'with-projects', label: 'With projects' },
  { value: 'without-projects', label: 'Without projects' },
];
const sortOptions = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
  { value: 'company', label: 'Company' },
];

type SearchParams = Promise<QueryValues>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const params = await searchParams;
  const query = queryValue(params, 'q');
  const relation = queryValue(params, 'relation');
  const sort = queryValue(params, 'sort') || 'updated';
  const result = listClients(workspace.id, { q: query, relation, sort, page: queryPage(params) });
  const hasFilters = Boolean(query || relation);
  const error = queryValue(params, 'error');

  return (
    <div className="space-y-6">
      <PageHeading title="Clients" description="People and companies you work with." action={{ href: '/clients/new', label: 'Add client' }} />
      {error && <p role="alert" className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <DataToolbar query={query} relation={relation} relationOptions={relationOptions} sort={sort} sortOptions={sortOptions} />
      {result.total === 0 ? (
        <p className="rounded-container border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {hasFilters ? <>No clients match these filters. <Link href="/clients" className="font-semibold text-primary underline">Clear filters</Link></> : 'No clients yet. Add your first client to keep their details and project history together.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-container border border-border bg-card" tabIndex={0} aria-label="Clients table, horizontally scrollable">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Client records</caption>
              <thead className="bg-muted/60 text-muted-foreground">
                <tr><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Company</th><th scope="col" className="p-3">Email</th><th scope="col" className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {result.items.map((client) => (
                  <tr key={client.id} className="border-t border-border">
                    <th scope="row" className="p-3 font-semibold"><Link href={`/clients/${client.id}`} className="underline-offset-4 hover:text-primary hover:underline">{client.name}</Link></th>
                    <td className="p-3">{client.company ?? '—'}</td>
                    <td className="p-3">{client.email ?? '—'}</td>
                    <td className="flex items-center gap-2 p-3">
                      <Link href={`/clients/${client.id}`} className="min-h-11 content-center font-semibold text-primary hover:underline">View</Link>
                      <ConfirmDelete id={client.id} name={client.name} action={deleteClientAction} description="Clients with active project records must be reassigned or have their projects removed first." />
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
