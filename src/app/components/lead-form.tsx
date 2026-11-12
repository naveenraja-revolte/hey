'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveLeadAction } from '@/app/actions/crm';
import type { ActionState } from '@/lib/action-state';
import { emptyActionState } from '@/lib/action-state';
import { leadStatuses } from '@/lib/domain';
import type { LeadInput } from '@/lib/crm-mutations';
import { ActionMessage, FieldMessage } from './action-message';
import { SubmitButton } from './submit-button';

type LeadFormProps = { lead?: LeadInput & { id: string } };
const input = 'min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';
const editableStatuses = leadStatuses.filter((status) => status !== 'Converted');

export function LeadForm({ lead }: LeadFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveLeadAction, emptyActionState);
  const editing = Boolean(lead);
  return (
    <form action={formAction} className="grid gap-5 rounded-container border border-border bg-card p-5 sm:p-6">
      {lead && <input type="hidden" name="leadId" value={lead.id} />}
      <ActionMessage state={state} />
      <Field id="lead-name" label="Name *" error={state.fieldErrors?.name?.[0]}>
        <input id="lead-name" name="name" required maxLength={120} defaultValue={lead?.name} className={input} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="lead-email" label="Email (optional)" error={state.fieldErrors?.email?.[0]}>
          <input id="lead-email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={lead?.email ?? ''} className={input} />
        </Field>
        <Field id="lead-phone" label="Phone (optional)" error={state.fieldErrors?.phone?.[0]}>
          <input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={lead?.phone ?? ''} className={input} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="lead-company" label="Company (optional)" error={state.fieldErrors?.company?.[0]}>
          <input id="lead-company" name="company" maxLength={120} defaultValue={lead?.company ?? ''} className={input} />
        </Field>
        <Field id="lead-source" label="Source *" error={state.fieldErrors?.source?.[0]}>
          <input id="lead-source" name="source" required maxLength={100} defaultValue={lead?.source} placeholder="Referral, website, event…" className={input} />
        </Field>
      </div>
      <Field id="lead-status" label="Status *" error={state.fieldErrors?.status?.[0]}>
        <select id="lead-status" name="status" defaultValue={lead?.status ?? 'New'} className={input}>
          {editableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </Field>
      <Field id="lead-notes" label="Notes (optional)" error={state.fieldErrors?.notes?.[0]}>
        <textarea id="lead-notes" name="notes" rows={5} maxLength={5000} defaultValue={lead?.notes ?? ''} className={`${input} py-2`} />
      </Field>
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Link href="/leads" className="min-h-11 content-center rounded-control px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</Link>
        <SubmitButton pendingLabel={editing ? 'Saving…' : 'Adding…'}>{editing ? 'Save changes' : 'Add lead'}</SubmitButton>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="grid gap-2 text-sm font-medium">{label}{children}<FieldMessage message={error} /></label>;
}
