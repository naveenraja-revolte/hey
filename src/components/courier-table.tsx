import Link from 'next/link';
import { PAGE_SIZE } from '@/lib/domain';
import { CourierActiveToggle } from './courier-active-toggle';
import { CourierEditForm } from './courier-edit-form';

type CourierListResult = Awaited<ReturnType<typeof import('@/lib/couriers').listCouriers>>;

function courierPageUrl(page: number, q: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page));
  return `/couriers?${params.toString()}`;
}

export function CourierTable({
  result,
  query,
  hasFilters,
}: {
  result: CourierListResult;
  query: { q: string; page: number };
  hasFilters: boolean;
}) {
  if (!result.total) {
    return (
      <section className="rounded-container border-border bg-card border border-dashed px-6 py-12 text-center">
        <h2 className="font-heading text-xl font-semibold">
          {hasFilters ? 'No couriers match that search' : 'No couriers on the roster yet'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {hasFilters
            ? 'Try a different name, email, or phone number.'
            : 'Add a courier to make them available for assignment.'}
        </p>
        {hasFilters && (
          <Link
            href="/couriers"
            className="text-primary mt-4 inline-flex min-h-11 items-center px-3 underline underline-offset-4"
          >
            Clear search
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
        aria-label="Courier roster, horizontally scrollable"
      >
        <table className="w-full min-w-[700px] text-left text-sm">
          <caption className="sr-only">Courier roster and current workload</caption>
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Courier
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Active deliveries
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Availability
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((courier) => (
              <tr key={courier.id} className="border-border border-t">
                <th scope="row" className="px-4 py-3 font-medium">
                  {courier.name}
                </th>
                <td className="px-4 py-3">
                  <span className="block">{courier.email}</span>
                  <span className="text-muted-foreground">{courier.phone}</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{courier.activeDeliveries}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${courier.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                  >
                    {courier.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <CourierEditForm courier={courier} />
                    <CourierActiveToggle
                      id={courier.id}
                      active={courier.active}
                      hasActiveDeliveries={courier.activeDeliveries > 0}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <span className="text-muted-foreground">
          Showing {(result.page - 1) * PAGE_SIZE + 1}–
          {Math.min(result.page * PAGE_SIZE, result.total)} of {result.total}
        </span>
        <div className="flex items-center gap-2">
          {result.page > 1 && (
            <Link
              rel="prev"
              href={courierPageUrl(result.page - 1, query.q)}
              className="rounded-control text-primary hover:bg-muted inline-flex min-h-11 items-center px-3"
            >
              Previous
            </Link>
          )}
          <span
            aria-current="page"
            className="rounded-control bg-muted inline-flex min-h-11 min-w-11 items-center justify-center font-medium tabular-nums"
          >
            {result.page}
          </span>
          {result.page < result.pages && (
            <Link
              href={courierPageUrl(result.page + 1, query.q)}
              className="rounded-control text-primary hover:bg-muted inline-flex min-h-11 items-center px-3"
            >
              Next
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
