'use client';

import { useRef } from 'react';
import { SubmitButton } from './submit-button';

type ConfirmDeleteProps = {
  id: string;
  name: string;
  action: (formData: FormData) => Promise<void>;
  description?: string;
  fieldName?: string;
};

export function ConfirmDelete({ id, name, action, description, fieldName = 'id' }: ConfirmDeleteProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="min-h-11 rounded-control px-3 text-sm font-medium text-destructive underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`Delete ${name}`}
      >
        Delete
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        className="m-auto w-[min(92vw,28rem)] rounded-container border border-border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-foreground/40"
      >
        <h2 id="delete-title" className="font-heading text-xl font-semibold text-balance">Delete {name}?</h2>
        <p id="delete-description" className="mt-3 text-sm leading-6 text-muted-foreground">
          {description ?? 'This action cannot be undone.'}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="min-h-11 rounded-control border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            Cancel
          </button>
          <form action={action}>
            <input type="hidden" name={fieldName} value={id} />
            <SubmitButton variant="danger" pendingLabel="Deleting…">Delete</SubmitButton>
          </form>
        </div>
      </dialog>
    </>
  );
}
