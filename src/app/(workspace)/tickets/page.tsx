import Link from 'next/link';
import type { Metadata } from 'next';
import { z } from 'zod';
import type { TicketStatus } from '@/db/app-schema';
import { requireWorkspaceViewer } from '@/lib/viewer';
import { listTickets } from '@/services/ticket.service';

export const metadata: Metadata = {
  title: 'Ticket queue · Dispatch Desk',
};

const statusLabels: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const statusOptions = ['all', 'new', 'in_progress', 'resolved'] as const;

type SearchParams = Promise<{
  page?: string;
  q?: string;
  status?: string;
}>;

function makePageHref(page: number, status: string, query: string) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('status', status);
  if (query) params.set('q', query);
  return `/tickets?${params.toString()}`;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const viewer = await requireWorkspaceViewer();
  const params = await searchParams;
  const status = statusOptions.includes(params.status as (typeof statusOptions)[number])
    ? (params.status as (typeof statusOptions)[number])
    : 'all';
  const query = z.string().trim().max(100).catch('').parse(params.q ?? '');
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = listTickets(viewer, { status, query, page });
  const title = viewer.role === 'admin' ? 'All tickets' : 'My queue';

  return (
    <section className="page-section">
      <div className="page-heading queue-heading">
        <div>
          <span className="eyebrow">Support operations</span>
          <h1>{title}</h1>
          <p>{viewer.role === 'admin'
            ? 'Every ticket, with ownership visible at a glance.'
            : 'Your assigned work, in one focused queue.'}</p>
        </div>
        <Link className="button button-primary" href="/tickets/new">Create ticket</Link>
      </div>

      <div className="queue-toolbar">
        <nav aria-label="Filter tickets by status" className="filter-tabs">
          {statusOptions.map((option) => (
            <Link
              aria-current={status === option ? 'page' : undefined}
              className={status === option ? 'filter-tab is-current' : 'filter-tab'}
              href={makePageHref(1, option, query)}
              key={option}
            >
              {option === 'all' ? 'All statuses' : statusLabels[option]}
            </Link>
          ))}
        </nav>
        <form action="/tickets" className="search-form" method="get">
          <input name="status" type="hidden" value={status} />
          <label className="sr-only" htmlFor="ticket-search">Search tickets</label>
          <input
            defaultValue={query}
            id="ticket-search"
            maxLength={100}
            name="q"
            placeholder="Search subject or details"
            type="search"
          />
          <button className="button button-secondary button-small" type="submit">Search</button>
        </form>
      </div>

      {result.items.length > 0 ? (
        <div className="table-frame">
          <table className="ticket-table">
            <thead>
              <tr>
                <th scope="col">Ticket</th>
                <th scope="col">Topic / team</th>
                <th scope="col">Submitted by</th>
                {viewer.role === 'admin' && <th scope="col">Assigned to</th>}
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link className="ticket-subject" href={`/tickets/${ticket.id}`}>
                      <span className="ticket-ref">#{ticket.id.slice(0, 8)}</span>
                      <span>{ticket.subject}</span>
                    </Link>
                  </td>
                  <td>
                    <span className="table-primary">{ticket.topicName}</span>
                    <span className="table-secondary">{ticket.teamName}</span>
                  </td>
                  <td>{ticket.requesterName}</td>
                  {viewer.role === 'admin' && <td>{ticket.assigneeName}</td>}
                  <td><span className={`status-pill status-${ticket.status}`}>{statusLabels[ticket.status]}</span></td>
                  <td className="date-cell">
                    <time dateTime={ticket.updatedAt.toISOString()}>
                      {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(ticket.updatedAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="empty-state">
          <span aria-hidden="true" className="empty-mark">—</span>
          <span className="eyebrow">Queue clear</span>
          <h2>{query || status !== 'all' ? 'No tickets match this view.' : 'Nothing in your queue yet.'}</h2>
          <p>{query || status !== 'all'
            ? 'Try another status or a shorter search.'
            : 'When a ticket is routed to you, it will appear here.'}</p>
          <Link className="button button-secondary" href="/tickets/new">Create a ticket</Link>
        </section>
      )}

      {result.total > 0 && (
        <div className="pagination-bar">
          <span>Showing page {result.page} of {result.totalPages} · {result.total} {result.total === 1 ? 'ticket' : 'tickets'}</span>
          <div className="pagination-actions">
            {result.page > 1 && <Link className="button button-secondary button-small" href={makePageHref(result.page - 1, status, query)}>Previous</Link>}
            {result.page < result.totalPages && <Link className="button button-secondary button-small" href={makePageHref(result.page + 1, status, query)}>Next</Link>}
          </div>
        </div>
      )}
    </section>
  );
}
