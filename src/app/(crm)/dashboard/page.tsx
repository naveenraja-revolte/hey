import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeading } from '@/app/components/page-heading';
import { StatusBadge } from '@/app/components/status-badge';
import { dashboardData } from '@/lib/crm-queries';
import { currentWorkspace, requireAccount } from '@/lib/session';

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function DashboardPage() {
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) redirect('/workspaces');
  const data = dashboardData(workspace.id);

  return (
    <div className="space-y-8">
      <PageHeading title="Overview" description={`Your work at a glance in ${workspace.name}.`} />
      <section aria-label="Workspace totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Clients" value={data.totals.clients} href="/clients" />
        <SummaryCard label="Leads" value={data.totals.leads} href="/leads" />
        <SummaryCard label="Projects" value={data.totals.projects} href="/projects" />
        <SummaryCard label="Active projects" value={data.totals.activeProjects} href="/projects?status=Active" />
      </section>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">Active projects</h2>
            <Link href="/projects?status=Active" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All active</Link>
          </header>
          {data.activeProjects.length === 0 ? (
            <p className="rounded-container border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No active projects right now.</p>
          ) : (
            <ul className="divide-y divide-border rounded-container border border-border bg-card">
              {data.activeProjects.map(({ project, clientName }) => (
                <li key={project.id} className="p-4">
                  <Link href={`/projects/${project.id}`} className="font-semibold hover:text-primary">{project.name}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{clientName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">Upcoming deadlines</h2>
            <Link href="/projects" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All projects</Link>
          </header>
          {data.deadlines.length === 0 ? (
            <p className="rounded-container border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No deadlines in the next 30 days.</p>
          ) : (
            <ul className="divide-y divide-border rounded-container border border-border bg-card">
              {data.deadlines.map(({ project, clientName }) => (
                <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link href={`/projects/${project.id}`} className="font-semibold hover:text-primary">{project.name}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">{clientName} · Due {formatDate(project.deadline)}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="rounded-container border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Activity will appear here as you add and update records.</p>
          ) : (
            <ol className="divide-y divide-border rounded-container border border-border bg-card">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-4 p-4">
                  <p className="text-sm leading-6">{activity.summary}</p>
                  <time dateTime={activity.createdAt} className="shrink-0 text-xs text-muted-foreground">{dateFormat.format(new Date(activity.createdAt))}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-container border border-border border-l-4 border-l-primary bg-card p-5 transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="mt-3 block font-heading text-3xl font-semibold tabular-nums">{value}</span>
    </Link>
  );
}

function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(`${value}T12:00:00`)) : 'Not scheduled';
}
