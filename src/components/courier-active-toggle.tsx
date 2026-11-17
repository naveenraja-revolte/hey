'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function CourierActiveToggle({
  id,
  active,
  hasActiveDeliveries,
}: {
  id: number;
  active: boolean;
  hasActiveDeliveries: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function updateAvailability() {
    setPending(true);
    setError('');
    try {
      const response = await fetch(`/api/couriers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? 'Courier availability could not be changed.');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Could not reach the courier service. Try again.');
      return false;
    } finally {
      setPending(false);
    }
  }

  async function confirmDeactivation() {
    if (await updateAvailability()) dialog.current?.close();
  }

  function requestAvailabilityChange() {
    if (active) {
      dialog.current?.showModal();
      return;
    }
    void updateAvailability();
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={requestAvailabilityChange}
        disabled={pending}
        className="rounded-control text-primary hover:bg-muted focus-visible:outline-ring min-h-11 px-3 text-sm font-medium focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Saving…' : active ? 'Deactivate' : 'Activate'}
      </button>
      {error && !active && (
        <p role="alert" className="text-destructive max-w-48 text-xs">
          {error}
        </p>
      )}
      {active && hasActiveDeliveries && (
        <p className="text-muted-foreground max-w-48 text-xs">
          Reassign active deliveries before deactivating.
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby={`deactivate-title-${id}`}
        className="rounded-container border-border bg-card text-card-foreground backdrop:bg-foreground/40 m-auto w-[min(28rem,calc(100vw-2rem))] border p-6 shadow-xl"
      >
        <h2 id={`deactivate-title-${id}`} className="font-heading text-xl font-semibold">
          Deactivate this courier?
        </h2>
        <p className="text-muted-foreground mt-2 text-pretty">
          The courier will no longer be available for new assignments.
        </p>
        {error && active && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-control hover:bg-muted focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2"
          >
            Keep active
          </button>
          <button
            type="button"
            onClick={confirmDeactivation}
            disabled={pending}
            className="rounded-control bg-destructive text-destructive-foreground focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2 disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Confirm deactivation'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
