'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  createTicketAction,
  reassignTicketAction,
  updateTicketStatusAction,
  type ActionState,
} from '@/app/actions/tickets';
import type { TicketStatus } from '@/db/app-schema';

const statusLabels: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

type TopicOption = {
  id: string;
  name: string;
  teamName: string;
};

export function TicketComposer({ topics }: { topics: TopicOption[] }) {
  const [state, action, pending] = useActionState(createTicketAction, null);

  if (state?.kind === 'success') {
    return (
      <section className="success-panel" aria-live="polite">
        <span className="eyebrow">Ticket submitted</span>
        <h2>Your request is in the queue.</h2>
        <p>{state.message} Ticket reference {state.ticketId?.slice(0, 8)}.</p>
        <a className="button button-secondary" href="/tickets">Return to your queue</a>
      </section>
    );
  }

  return (
    <form action={action} className="form-stack ticket-form">
      <label className="field">
        <span>Topic</span>
        <select defaultValue="" name="topicId" required>
          <option disabled value="">Choose a topic</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name} · {topic.teamName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Subject</span>
        <input maxLength={120} minLength={4} name="subject" required />
        <small>Summarize the issue in a few words.</small>
      </label>
      <label className="field">
        <span>Description</span>
        <textarea maxLength={5000} minLength={10} name="description" required rows={7} />
        <small>Include the details a teammate will need to get started.</small>
      </label>
      {state?.kind === 'error' && (
        <p className="form-message form-message-error" role="alert">{state.message}</p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? 'Submitting…' : 'Submit ticket'}
        </button>
        <a className="text-link" href="/tickets">Cancel</a>
      </div>
    </form>
  );
}

export function TicketStatusForm({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  const [state, action, pending] = useActionState(updateTicketStatusAction, null);

  return (
    <form action={action} className="inline-form">
      <input name="ticketId" type="hidden" value={ticketId} />
      <label className="sr-only" htmlFor={`status-${ticketId}`}>Ticket status</label>
      <select defaultValue={status} id={`status-${ticketId}`} name="status">
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <button className="button button-secondary" disabled={pending} type="submit">
        {pending ? 'Saving…' : 'Update status'}
      </button>
      {state && <span className={`inline-message ${state.kind}`} role="status">{state.message}</span>}
    </form>
  );
}

type AssigneeOption = {
  id: string;
  name: string;
  teamName: string;
};

export function ReassignmentForm({
  ticketId,
  assigneeId,
  assignees,
}: {
  ticketId: string;
  assigneeId: string;
  assignees: AssigneeOption[];
}) {
  const [state, action, pending] = useActionState(reassignTicketAction, null);

  return (
    <form action={action} className="inline-form">
      <input name="ticketId" type="hidden" value={ticketId} />
      <label className="sr-only" htmlFor={`assignee-${ticketId}`}>Assigned teammate</label>
      <select defaultValue={assigneeId} id={`assignee-${ticketId}`} name="assigneeId">
        {assignees.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} · {person.teamName}
          </option>
        ))}
      </select>
      <button className="button button-secondary" disabled={pending} type="submit">
        {pending ? 'Saving…' : 'Reassign'}
      </button>
      {state && <span className={`inline-message ${state.kind}`} role="status">{state.message}</span>}
    </form>
  );
}

export function ActionFeedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return <p className={`form-message form-message-${state.kind}`} role="status">{state.message}</p>;
}
