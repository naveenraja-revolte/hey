import Link from 'next/link';
import { deliveryCode, formatDateTime } from '@/lib/format';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/lib/domain';
import { DeliveryPagination, type DeliveryQuery } from './delivery-pagination';

type DeliveryListResult = Awaited<ReturnType<typeof import('@/lib/deliveries').listDeliveries>>;

export function DeliveryTable({
  result,
  hasFilters,
  query,
}: {
  result: DeliveryListResult;
  hasFilters: boolean;
  query: DeliveryQuery;
}) {
  if (!result.total) {
    return (
      <section className="rounded-container border-border bg-card border border-dashed px-6 py-12 text-center">
        <h2 className="font-heading text-xl font-semibold">
          {hasFilters ? 'No deliveries match those filters' : 'No deliveries yet'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {hasFilters
            ? 'Clear filters to see all delivery jobs.'
            : 'Create the first delivery to start dispatching.'}
        </p>
        {hasFilters ? (
          <Link
            href="/deliveries"
            className="text-primary mt-4 inline-flex min-h-11 items-center px-3 underline underline-offset-4"
          >
            Clear filters
          </Link>
        ) : (
          <Link
            href="/deliveries/new"
            className="rounded-control bg-primary text-primary-foreground mt-4 inline-flex min-h-11 items-center px-4"
          >
            Create delivery
          </Link>
        )}
      </section>
    );
  }

  return (
    <>
      <div
        className="rounded-container border-border bg-card overflow-x-auto border"
        tabIndex={0}
        aria-label="Delivery table, horizontally scrollable"
      >
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Delivery jobs</caption>
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Delivery
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Route
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Courier
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((delivery) => (
              <tr key={delivery.id} className="border-border hover:bg-muted/40 border-t">
                <th scope="row" className="px-4 py-3 font-medium">
                  <Link
                    href={`/deliveries/${delivery.id}`}
                    className="text-foreground focus-visible:outline-ring underline-offset-4 hover:underline focus-visible:outline-2"
                  >
                    <span className="block">{delivery.recipientName}</span>
                    <span className="text-muted-foreground mt-1 block font-mono text-xs">
                      {deliveryCode(delivery.id)}
                    </span>
                  </Link>
                </th>
                <td className="text-muted-foreground max-w-64 px-4 py-3">
                  <span className="block truncate">{delivery.pickupAddress}</span>
                  <span className="block truncate">to {delivery.dropoffAddress}</span>
                </td>
                <td className="px-4 py-3">
                  {delivery.courierName ?? (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[delivery.status]}`}
                  >
                    {STATUS_LABELS[delivery.status]}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {formatDateTime(delivery.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DeliveryPagination result={result} query={query} />
    </>
  );
}
