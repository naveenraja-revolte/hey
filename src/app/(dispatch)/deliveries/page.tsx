import Link from 'next/link';
import { getDatabase } from '@/db';
import { listActiveCouriers } from '@/lib/couriers';
import { listDeliveries } from '@/lib/deliveries';
import { DELIVERY_STATUSES, STATUS_LABELS } from '@/lib/domain';
import { deliveryQuerySchema } from '@/lib/validation';
import { DeliveryTable } from '@/components/delivery-table';

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DeliveriesPage({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const parsed = deliveryQuerySchema.parse({
    q: firstValue(params.q),
    status: firstValue(params.status),
    courierId: firstValue(params.courierId),
    sort: firstValue(params.sort),
    page: firstValue(params.page),
  });
  const db = getDatabase();
  const [result, couriers] = await Promise.all([
    listDeliveries(db, parsed),
    listActiveCouriers(db),
  ]);
  const hasFilters = Boolean(parsed.q || parsed.status || parsed.courierId);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Deliveries
          </h1>
          <p className="text-muted-foreground text-pretty">
            Create jobs, assign couriers, and follow each handoff.
          </p>
        </div>
        <Link
          href="/deliveries/new"
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-11 items-center px-4 font-medium transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
        >
          New delivery
        </Link>
      </header>
      <form
        action="/deliveries"
        className="rounded-container border-border bg-card grid gap-3 border p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="grid gap-1 text-sm font-medium lg:col-span-2">
          Search deliveries
          <input
            name="q"
            defaultValue={parsed.q}
            placeholder="Recipient or address"
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={parsed.status}
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          >
            <option value="">All statuses</option>
            {DELIVERY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Courier
          <select
            name="courierId"
            defaultValue={parsed.courierId}
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          >
            <option value="">All couriers</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Sort
          <select
            name="sort"
            defaultValue={parsed.sort}
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-control border-border hover:bg-muted focus-visible:outline-ring min-h-11 border px-4 font-medium transition-colors focus-visible:outline-2"
          >
            Apply filters
          </button>
          {hasFilters && (
            <Link
              href="/deliveries"
              className="text-primary inline-flex min-h-11 items-center px-3 text-sm font-medium underline underline-offset-4"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>
      <DeliveryTable result={result} hasFilters={hasFilters} query={parsed} />
    </div>
  );
}
