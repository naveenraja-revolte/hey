"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ShipmentRow,
  type ShipmentRowData,
} from "@/app/staff/shipments/shipment-row";
import type { ShipmentStatus } from "@/lib/shipment-status";

type ShipmentListResult = {
  items: ShipmentRowData[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

export function ShipmentOperations({
  result,
  hasFilters,
  query,
}: {
  result: ShipmentListResult;
  hasFilters: boolean;
  query: { search: string; status?: ShipmentStatus };
}) {
  if (result.total === 0) {
    return hasFilters ? (
      <div className="rounded-container border-border border border-dashed p-8 text-center">
        <p className="font-medium">No shipments match those filters.</p>
        <Link
          href="/staff/shipments"
          className={[
            "text-primary focus-visible:outline-ring mt-3 inline-flex",
            "min-h-11 items-center underline underline-offset-4 focus-visible:outline-2",
          ].join(" ")}
        >
          Clear filters
        </Link>
      </div>
    ) : (
      <div className="rounded-container border-border border border-dashed p-8 text-center">
        <p className="font-medium">No parcels have been registered yet.</p>
        <p className="text-muted-foreground mt-2">
          A shipment will appear here after it is booked.
        </p>
      </div>
    );
  }

  const queryString = new URLSearchParams();
  if (query.search) queryString.set("q", query.search);
  if (query.status) queryString.set("status", query.status);
  const previousHref = new URLSearchParams(queryString);
  previousHref.set("page", String(result.page - 1));
  const nextHref = new URLSearchParams(queryString);
  nextHref.set("page", String(result.page + 1));

  return (
    <>
      <div
        className="rounded-container border-border overflow-x-auto border"
        tabIndex={0}
        aria-label="Shipment list, scrollable"
      >
        <table className="w-full min-w-[60rem] text-left text-sm">
          <caption className="sr-only">
            Shipments assigned to the delivery team
          </caption>
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="p-4 font-medium">
                Tracking
              </th>
              <th scope="col" className="p-4 font-medium">
                Sender / recipient
              </th>
              <th scope="col" className="p-4 font-medium">
                Registered
              </th>
              <th scope="col" className="p-4 font-medium">
                Status
              </th>
              <th scope="col" className="p-4 font-medium">
                Record update
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((shipment) => (
              <ShipmentRow key={shipment.id} shipment={shipment} />
            ))}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Pagination"
        className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm"
      >
        <p className="text-muted-foreground">
          Showing {(result.page - 1) * result.pageSize + 1}–
          {Math.min(result.page * result.pageSize, result.total)} of{" "}
          {result.total}
        </p>
        <div className="flex items-center gap-2">
          {result.page > 1 && (
            <Link
              href={`/staff/shipments?${previousHref.toString()}`}
              rel="prev"
              className={[
                "rounded-control border-border focus-visible:outline-ring",
                "inline-flex min-h-11 items-center gap-2 border px-3 focus-visible:outline-2",
              ].join(" ")}
            >
              <ArrowLeft aria-hidden className="size-4" /> Previous
            </Link>
          )}
          <span
            aria-current="page"
            className="rounded-control bg-muted min-h-11 min-w-11 px-3 py-3 text-center tabular-nums"
          >
            {result.page}
          </span>
          {result.page < result.pages && (
            <Link
              href={`/staff/shipments?${nextHref.toString()}`}
              rel="next"
              className={[
                "rounded-control border-border focus-visible:outline-ring",
                "inline-flex min-h-11 items-center gap-2 border px-3 focus-visible:outline-2",
              ].join(" ")}
            >
              Next <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
