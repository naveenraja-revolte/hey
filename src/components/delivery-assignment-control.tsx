'use client';

import { useState, type FormEvent } from 'react';
import type { CourierOption, DeliveryControlRecord } from './delivery-control-types';
import { useDeliveryUpdate } from './use-delivery-update';

export function DeliveryAssignmentControl({
  delivery,
  couriers,
}: {
  delivery: DeliveryControlRecord;
  couriers: CourierOption[];
}) {
  const [courierId, setCourierId] = useState(delivery.courierId ? String(delivery.courierId) : '');
  const { update, pending, error, success } = useDeliveryUpdate(delivery.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await update({ courierId: courierId ? Number(courierId) : null });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="courierId" className="grid gap-2 text-sm font-medium">
        Assign courier
        <select
          id="courierId"
          value={courierId}
          onChange={(event) => setCourierId(event.target.value)}
          className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
        >
          <option value="">Unassigned</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending || courierId === (delivery.courierId ? String(delivery.courierId) : '')}
        className="rounded-control border-border hover:bg-muted focus-visible:outline-ring min-h-11 w-full border px-4 font-medium focus-visible:outline-2 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save assignment'}
      </button>
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
    </form>
  );
}
