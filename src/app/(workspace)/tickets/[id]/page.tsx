import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ReassignmentForm, TicketStatusForm } from '@/components/ticket-forms';
import { requireWorkspaceViewer } from '@/lib/viewer';
import { getTicketForViewer, getActiveAssignees } from '@/services/ticket.service';
import type { TicketStatus } from '@/db/app-schema';

export const metadata: Metadata = {
  title: 'Ticket details · Dispatch Desk',
};

const statusLabels: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireWorkspaceViewer();
  const { id } = await params;
  const ticket = getTicketForViewer(id, viewer);

  if (!ticket) {
    notFound();
  }

  const assignees = viewer.role === 'admin' ? getActiveAssignees() : [];

  return (
    <section className="page-section page-narrow">
      <Link className="back-link" href="/tickets">← Back to queue</Link>
      <div className="detail-heading">
        <div>
          <span className="ticket-ref">Ticket #{ticket.id.slice(0, 8)}</span>
          <h1>{ticket.subject}</h1>
          <p className="detail-subtitle">Submitted by {ticket.requesterName} · {ticket.requesterEmail}</p>
        </div>
        <span className={`status-pill status-${ticket.status}`}>{statusLabels[ticket.status]}</span>
      </div>

      <div className="detail-grid">
        <article className="detail-panel description-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Request details</span>
              <h2>{ticket.topicName}</h2>
            </div>
            <span className="team-tag">{ticket.teamName}</span>
          </div>
          <p className="ticket-description">{ticket.description}</p>
          <div className="detail-timestamps">
            <span>Created <time dateTime={ticket.createdAt.toISOString()}>{ticket.createdAt.toLocaleString()}</time></span>
            <span>Updated <time dateTime={ticket.updatedAt.toISOString()}>{ticket.updatedAt.toLocaleString()}</time></span>
          </div>
        </article>

        <aside className="detail-panel ownership-panel">
          <span className="eyebrow">Ownership</span>
          <h2>{ticket.assigneeName}</h2>
          <p>Assigned teammate</p>
          {viewer.role === 'admin' ? (
            <ReassignmentForm assigneeId={ticket.assigneeId} assignees={assignees} ticketId={ticket.id} />
          ) : (
            <TicketStatusForm status={ticket.status} ticketId={ticket.id} />
          )}
        </aside>
      </div>
    </section>
  );
}
