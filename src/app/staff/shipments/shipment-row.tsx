"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/status-badge";
import {
  getAllowedNextStatuses,
  shipmentStatusLabels,
  type ShipmentStatus,
} from "@/lib/shipment-status";

export type ShipmentRowData = {
  id: string;
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  recipientAddress: string;
  status: ShipmentStatus;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const fieldClassName = [
  "rounded-control border-border bg-background",
  "focus-visible:ring-ring min-h-11 border px-2 text-sm outline-none focus-visible:ring-2",
].join(" ");
const submitButtonClassName = [
  "rounded-control bg-primary text-primary-foreground focus-visible:outline-ring",
  "min-h-11 px-3 font-medium transition hover:opacity-90",
  "focus-visible:outline-2 active:scale-[0.98] disabled:opacity-60",
].join(" ");

export function ShipmentRow({ shipment }: { shipment: ShipmentRowData }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const nextStatuses = getAllowedNextStatuses(shipment.status);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/staff/shipments/${encodeURIComponent(shipment.trackingNumber)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status: form.get("status"),
            note: form.get("note"),
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not update this parcel.");
        return;
      }
      router.refresh();
    } catch {
      setError("We could not connect. Try the update again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <tr className="border-border border-t align-top">
      <th scope="row" className="p-4 font-medium">
        <Link
          href={`/track/${encodeURIComponent(shipment.trackingNumber)}`}
          className="text-primary focus-visible:outline-ring underline underline-offset-4 focus-visible:outline-2"
        >
          {shipment.trackingNumber}
        </Link>
      </th>
      <td className="p-4">
        <p>
          {shipment.senderName} to {shipment.recipientName}
        </p>
        <p className="text-muted-foreground mt-1 max-w-xs text-pretty">
          {shipment.recipientAddress}
        </p>
      </td>
      <td className="text-muted-foreground p-4 whitespace-nowrap">
        {dateFormatter.format(new Date(shipment.createdAt))}
      </td>
      <td className="p-4">
        <StatusBadge status={shipment.status} />
      </td>
      <td className="p-4">
        {nextStatuses.length ? (
          <form onSubmit={updateStatus} className="grid min-w-52 gap-2">
            <label htmlFor={`status-${shipment.id}`} className="sr-only">
              Next status for {shipment.trackingNumber}
            </label>
            <select
              id={`status-${shipment.id}`}
              name="status"
              defaultValue={nextStatuses[0]}
              className={fieldClassName}
            >
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {shipmentStatusLabels[status]}
                </option>
              ))}
            </select>
            <label htmlFor={`note-${shipment.id}`} className="sr-only">
              Update note for {shipment.trackingNumber} (optional)
            </label>
            <input
              id={`note-${shipment.id}`}
              name="note"
              maxLength={500}
              placeholder="Note (optional)"
              className={fieldClassName}
            />
            <button
              type="submit"
              disabled={pending}
              className={submitButtonClassName}
            >
              {pending ? "Saving…" : "Save update"}
            </button>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </form>
        ) : (
          <p className="text-muted-foreground">Delivery complete</p>
        )}
      </td>
    </tr>
  );
}
