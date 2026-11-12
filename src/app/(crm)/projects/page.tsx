import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConfirmDelete } from '@/app/components/confirm-delete';
import { DataToolbar } from '@/app/components/data-toolbar';
import { PageHeading } from '@/app/components/page-heading';
import { Pagination } from '@/app/components/pagination';
import { StatusBadge } from '@/app/components/status-badge';
import { deleteProjectAction } from '@/app/actions/crm';
import { projectStatuses } from '@/lib/domain';
import { listProjects, workspaceClientOptions } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';
import { flatQuery, queryPage, queryValue, type QueryValues } from '@/lib/url-state';

const statuses = projectStatuses.map((status) => ({ value: status, label: status }));
const sorts = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'updated', label: 'Recently updated' },
];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const today = new Date().toISOString().slice(0, 10);

type Props = { searchParams: Promise<QueryValues> };

export default async function ProjectsPage({ searchParams }: Props) {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const params = await searchParams;
  const [clients, query] = [workspaceClientOptions(workspace.id), queryValue(params, 'q')];
  const status = queryValue(params, 'status');
  const clientId = queryValue(params, 'clientId');
  const sort = queryValue(params, 'sort') || 'deadline';
  const overdue = queryValue(params, 'overdue') === 'true';
  const result = listProjects(workspace.id, { q: query, status, clientId, sort, overdue, page: queryPage(params) });
  const hasFilters = Boolean(query || status || clientId || overdue);
  const error = queryValue(params, 'error');

  return (
    <div className="space-y-6">
      <PageHeading title="Projects" description="Track client work, budgets, status, and deadlines." action={{ href: '/projects/new', label: 'Add project' }} />
      {error && <p role="alert" className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <DataToolbar query={query} status={status} statusOptions={statuses} clientId={clientId} clientOptions={clients} showOverdue overdue={overdue} sort={sort} sortOptions={sorts} />
      {result.total === 0 ? (
        <p className="rounded-container border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {hasFilters ? <>No projects match these filters. <Link href="/projects" className="font-semibold text-primary underline">Clear filters</Link></> : 'No projects yet. Create a project and link it to a client.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-container border border-border bg-card" tabIndex={0} aria-label="Projects table, horizontally scrollable">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <caption className="sr-only">Project records</caption>
              <thead className="bg-muted/60 text-muted-foreground">
                <tr><th scope="col" className="p-3">Project</th><th scope="col" className="p-3">Client</th><th scope="col" className="p-3 text-right">Budget</th><th scope="col" className="p-3">Deadline</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {result.items.map(({ project, clientName }) => {
                  const isOverdue = Boolean(project.deadline && project.deadline < today && !['Completed', 'Cancelled'].includes(project.status));
                  return (
                    <tr key={project.id} className={`border-t border-border ${isOverdue ? 'bg-destructive/5' : ''}`}>
                      <th scope="row" className="p-3 font-semibold"><Link href={`/projects/${project.id}`} className="underline-offset-4 hover:text-primary hover:underline">{project.name}</Link>{isOverdue && <span className="ml-2 text-xs font-semibold text-destructive">Overdue</span>}</th>
                      <td className="p-3">{clientName}</td>
                      <td className="p-3 text-right tabular-nums">{project.budgetCents == null ? '—' : money.format(project.budgetCents / 100)}</td>
                      <td className={`p-3 ${isOverdue ? 'font-semibold text-destructive' : ''}`}>{project.deadline ?? 'Not set'}</td>
                      <td className="p-3"><StatusBadge status={project.status} /></td>
                      <td className="flex items-center gap-2 p-3">
                        <Link href={`/projects/${project.id}/edit`} className="min-h-11 content-center font-semibold text-primary hover:underline">Edit</Link>
                        <ConfirmDelete id={project.id} name={project.name} action={deleteProjectAction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination result={result} searchParams={flatQuery(params)} />
        </div>
      )}
    </div>
  );
}
