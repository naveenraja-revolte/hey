"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  shipmentStatuses,
  shipmentStatusLabels,
  type ShipmentStatus,
} from "@/lib/shipment-status";

export function ShipmentFilters({
  initialSearch,
  initialStatus,
}: {
  initialSearch: string;
  initialStatus: ShipmentStatus | "";
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateQuery(nextSearch: string, nextStatus: string) {
    const params = new URLSearchParams(window.location.search);
    if (nextSearch) params.set("q", nextSearch);
    else params.delete("q");
    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/staff/shipments?${query}` : "/staff/shipments");
  }

  function changeSearch(value: string) {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const selectedStatus =
        new URLSearchParams(window.location.search).get("status") ?? "";
      updateQuery(value.trim(), selectedStatus);
    }, 300);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <form
      role="search"
      className="mb-6 flex flex-wrap items-end gap-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="grid min-w-56 flex-1 gap-2">
        <span className="font-medium">Search shipments</span>
        <input
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="Tracking number or name"
          className="rounded-control border-border bg-background focus-visible:ring-ring min-h-12 border px-3 text-base outline-none focus-visible:ring-2"
        />
      </label>
      <label className="grid min-w-52 gap-2">
        <span className="font-medium">Delivery status</span>
        <select
          value={initialStatus}
          onChange={(event) => updateQuery(search.trim(), event.target.value)}
          className="rounded-control border-border bg-background focus-visible:ring-ring min-h-12 border px-3 text-base outline-none focus-visible:ring-2"
        >
          <option value="">All statuses</option>
          {shipmentStatuses.map((status) => (
            <option key={status} value={status}>
              {shipmentStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
