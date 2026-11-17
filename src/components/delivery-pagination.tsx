import Link from 'next/link';
import { PAGE_SIZE } from '@/lib/domain';

type DeliveryListResult = {
  total: number;
  page: number;
  pages: number;
};

export type DeliveryQuery = {
  q: string;
  status: string;
  courierId: number | '';
  sort: 'newest' | 'oldest';
  page: number;
};

function pageUrl(page: number, query: DeliveryQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  if (query.courierId) params.set('courierId', String(query.courierId));
  if (query.sort !== 'newest') params.set('sort', query.sort);
  params.set('page', String(page));
  return `/deliveries?${params.toString()}`;
}

export function DeliveryPagination({
  result,
  query,
}: {
  result: DeliveryListResult;
  query: DeliveryQuery;
}) {
  return (
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
            href={pageUrl(result.page - 1, query)}
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
            href={pageUrl(result.page + 1, query)}
            className="rounded-control text-primary hover:bg-muted inline-flex min-h-11 items-center px-3"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
