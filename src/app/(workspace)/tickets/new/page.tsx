import Link from 'next/link';
import type { Metadata } from 'next';
import { TicketComposer } from '@/components/ticket-forms';
import { requireWorkspaceViewer } from '@/lib/viewer';
import { getActiveTicketTopics } from '@/services/ticket.service';

export const metadata: Metadata = {
  title: 'New ticket · Dispatch Desk',
};

export default async function NewTicketPage() {
  await requireWorkspaceViewer();
  const topics = getActiveTicketTopics();

  return (
    <section className="page-section page-narrow">
      <Link className="back-link" href="/tickets">← Back to queue</Link>
      <div className="page-heading">
        <span className="eyebrow">New support request</span>
        <h1>What needs attention?</h1>
        <p>Choose the closest topic. We’ll route your request to the right team and balance it across available teammates.</p>
      </div>
      {topics.length > 0 ? (
        <TicketComposer topics={topics} />
      ) : (
        <section className="empty-state empty-state-compact">
          <span className="eyebrow">Routing not ready</span>
          <h2>No active topics are available.</h2>
          <p>An administrator needs to set up a team and topic before tickets can be submitted.</p>
          <Link className="button button-secondary" href="/tickets">Return to queue</Link>
        </section>
      )}
    </section>
  );
}
