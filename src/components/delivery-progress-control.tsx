'use client';

import { useRef, useState, type FormEvent } from 'react';
import { STATUS_LABELS, STATUS_TRANSITIONS, type DeliveryStatus } from '@/lib/domain';
import type { DeliveryControlRecord } from './delivery-control-types';
import { useDeliveryUpdate } from './use-delivery-update';

export function DeliveryProgressControl({ delivery }: { delivery: DeliveryControlRecord }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<DeliveryStatus>(delivery.status);
  const { update, pending, error, success } = useDeliveryUpdate(delivery.id);
  const nextStatuses = STATUS_TRANSITIONS[delivery.status].filter(
    (nextStatus) =>
      nextStatus !== 'cancelled' && (nextStatus !== 'assigned' || delivery.courierId !== null)
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await update({ status })) setStatus(status);
  }

  async function confirmCancellation() {
    if (await update({ status: 'cancelled' })) dialog.current?.close();
  }

  return (
    <div className="border-border space-y-3 border-t pt-5">
      {nextStatuses.length > 0 ? (
        <>
          <form onSubmit={submit} className="space-y-3">
            <label htmlFor="status" className="grid gap-2 text-sm font-medium">
              Progress
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as DeliveryStatus)}
                className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
              >
                <option value={delivery.status}>{STATUS_LABELS[delivery.status]} (current)</option>
                {nextStatuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>
                    {STATUS_LABELS[nextStatus]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={pending || status === delivery.status}
              className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 w-full px-4 font-medium focus-visible:outline-2 disabled:opacity-50"
            >
              {pending ? 'Updating…' : 'Update progress'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            className="rounded-control border-destructive/40 text-destructive hover:bg-destructive/10 focus-visible:outline-ring min-h-11 w-full border px-4 text-sm font-medium focus-visible:outline-2"
          >
            Cancel delivery
          </button>
          <dialog
            ref={dialog}
            aria-labelledby="cancel-title"
            className="rounded-container border-border bg-card text-card-foreground backdrop:bg-foreground/40 m-auto w-[min(28rem,calc(100vw-2rem))] border p-6 shadow-xl"
          >
            <h2 id="cancel-title" className="font-heading text-xl font-semibold">
              Cancel this delivery?
            </h2>
            <p className="text-muted-foreground mt-2 text-pretty">
              The delivery will be marked cancelled and remain in its history.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="rounded-control hover:bg-muted focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2"
              >
                Keep delivery
              </button>
              <button
                type="button"
                onClick={confirmCancellation}
                disabled={pending}
                className="rounded-control bg-destructive text-destructive-foreground focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2 disabled:opacity-60"
              >
                {pending ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </dialog>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">This delivery is closed.</p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-success text-sm">
          {success}
        </p>
      )}
    </div>
  );
}
