'use client';

import { useActionState } from 'react';
import { createWorkspaceAction, renameWorkspaceAction } from '@/app/actions/workspaces';
import type { ActionState } from '@/lib/action-state';
import { emptyActionState } from '@/lib/action-state';
import { ActionMessage, FieldMessage } from './action-message';
import { SubmitButton } from './submit-button';

type WorkspaceFormProps = { mode: 'create' | 'rename'; currentName?: string };

export function WorkspaceForm({ mode, currentName = '' }: WorkspaceFormProps) {
  const action = mode === 'create' ? createWorkspaceAction : renameWorkspaceAction;
  const [state, formAction] = useActionState<ActionState, FormData>(action, emptyActionState);
  const creating = mode === 'create';
  return (
    <form action={formAction} className="grid gap-4 rounded-container border border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <ActionMessage state={state} />
      <label htmlFor={`workspace-${mode}-name`} className="grid gap-2 text-sm font-medium">
        {creating ? 'Workspace name *' : 'Rename active workspace *'}
        <input
          id={`workspace-${mode}-name`}
          name="name"
          required
          maxLength={100}
          defaultValue={currentName}
          aria-describedby={state.fieldErrors?.name ? `workspace-${mode}-error` : undefined}
          className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        />
        <FieldMessage message={state.fieldErrors?.name?.[0]} />
      </label>
      <SubmitButton pendingLabel={creating ? 'Creating…' : 'Saving…'}>{creating ? 'Create workspace' : 'Save name'}</SubmitButton>
    </form>
  );
}
