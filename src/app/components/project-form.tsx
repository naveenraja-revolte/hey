'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveProjectAction } from '@/app/actions/crm';
import type { ActionState } from '@/lib/action-state';
import { emptyActionState } from '@/lib/action-state';
import { projectStatuses } from '@/lib/domain';
import type { ProjectInput } from '@/lib/crm-mutations';
import { ActionMessage, FieldMessage } from './action-message';
import { SubmitButton } from './submit-button';

type ProjectFormProps = {
  clients: Array<{ id: string; name: string; company: string | null }>;
  project?: ProjectInput & { id: string; budgetCents: number | null };
  initialClientId?: string;
};
const input = 'min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

export function ProjectForm({ clients, project, initialClientId = '' }: ProjectFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveProjectAction, emptyActionState);
  const editing = Boolean(project);
  return (
    <form action={formAction} className="grid gap-5 rounded-container border border-border bg-card p-5 sm:p-6">
      {project && <input type="hidden" name="projectId" value={project.id} />}
      <ActionMessage state={state} />
      <Field id="project-name" label="Project name *" error={state.fieldErrors?.name?.[0]}>
        <input id="project-name" name="name" required maxLength={160} defaultValue={project?.name} className={input} />
      </Field>
      <Field id="project-client" label="Client *" error={state.fieldErrors?.clientId?.[0]}>
        <select id="project-client" name="clientId" required defaultValue={project?.clientId ?? initialClientId} className={input}>
          <option value="" disabled>Choose a client</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` — ${client.company}` : ''}</option>)}
        </select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="project-budget" label="Budget in USD (optional)" error={state.fieldErrors?.budget?.[0]}>
          <input id="project-budget" name="budget" inputMode="decimal" placeholder="0.00" defaultValue={project?.budgetCents == null ? '' : (project.budgetCents / 100).toFixed(2)} className={input} />
        </Field>
        <Field id="project-deadline" label="Deadline (optional)" error={state.fieldErrors?.deadline?.[0]}>
          <input id="project-deadline" name="deadline" type="date" defaultValue={project?.deadline ?? ''} className={input} />
        </Field>
        <Field id="project-status" label="Status *" error={state.fieldErrors?.status?.[0]}>
          <select id="project-status" name="status" defaultValue={project?.status ?? 'Planned'} className={input}>
            {projectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
      <Field id="project-description" label="Description (optional)" error={state.fieldErrors?.description?.[0]}>
        <textarea id="project-description" name="description" rows={5} maxLength={5000} defaultValue={project?.description ?? ''} className={`${input} py-2`} />
      </Field>
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Link href="/projects" className="min-h-11 content-center rounded-control px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</Link>
        <SubmitButton pendingLabel={editing ? 'Saving…' : 'Adding…'}>{editing ? 'Save changes' : 'Add project'}</SubmitButton>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="grid gap-2 text-sm font-medium">{label}{children}<FieldMessage message={error} /></label>;
}
