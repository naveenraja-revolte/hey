'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveClientAction } from '@/app/actions/crm';
import type { ActionState } from '@/lib/action-state';
import { emptyActionState } from '@/lib/action-state';
import type { ClientInput } from '@/lib/crm-mutations';
import { ActionMessage, FieldMessage } from './action-message';
import { SubmitButton } from './submit-button';

type ClientFormProps = { client?: ClientInput & { id: string } };
const input = 'min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

export function ClientForm({ client }: ClientFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveClientAction, emptyActionState);
  const editing = Boolean(client);
  return (
    <form action={formAction} className="grid gap-5 rounded-container border border-border bg-card p-5 sm:p-6">
      {client && <input type="hidden" name="clientId" value={client.id} />}
      <ActionMessage state={state} />
      <Field id="client-name" label="Name *" error={state.fieldErrors?.name?.[0]}>
        <input id="client-name" name="name" required maxLength={120} defaultValue={client?.name} className={input} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="client-email" label="Email (optional)" error={state.fieldErrors?.email?.[0]}>
          <input id="client-email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={client?.email ?? ''} className={input} />
        </Field>
        <Field id="client-phone" label="Phone (optional)" error={state.fieldErrors?.phone?.[0]}>
          <input id="client-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={client?.phone ?? ''} className={input} />
        </Field>
      </div>
      <Field id="client-company" label="Company (optional)" error={state.fieldErrors?.company?.[0]}>
        <input id="client-company" name="company" autoComplete="organization" maxLength={120} defaultValue={client?.company ?? ''} className={input} />
      </Field>
      <Field id="client-notes" label="Notes (optional)" error={state.fieldErrors?.notes?.[0]}>
        <textarea id="client-notes" name="notes" rows={5} maxLength={5000} defaultValue={client?.notes ?? ''} className={`${input} py-2`} />
      </Field>
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Link href={editing ? `/clients/${client?.id}` : '/clients'} className="min-h-11 content-center rounded-control px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</Link>
        <SubmitButton pendingLabel={editing ? 'Saving…' : 'Adding…'}>{editing ? 'Save changes' : 'Add client'}</SubmitButton>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="grid gap-2 text-sm font-medium">{label}{children}<FieldMessage message={error} /></label>;
}
