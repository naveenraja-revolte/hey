import Link from 'next/link';
import { shiftMonth } from '@/lib/expense-data';

type PaginationProps = {
  month: string;
  page: number;
  pageCount: number;
};

export function Pagination({ month, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const previousHref = `/?month=${encodeURIComponent(month)}&page=${page - 1}`;
  const nextHref = `/?month=${encodeURIComponent(month)}&page=${page + 1}`;

  return (
    <nav aria-label="Expense pages" className="pagination">
      {page > 1 ? (
        <Link href={previousHref}>Newer expenses</Link>
      ) : (
        <span aria-disabled="true">Newer expenses</span>
      )}
      <span className="pagination-count">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={nextHref}>Older expenses</Link>
      ) : (
        <span aria-disabled="true">Older expenses</span>
      )}
    </nav>
  );
}

export function MonthNavigation({ month, label }: { month: string; label: string }) {
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const currentMonth = shiftMonth(month, 0);

  return (
    <nav aria-label="Choose month" className="month-navigation">
      <Link
        aria-label="Previous month"
        className="month-arrow"
        href={`/?month=${encodeURIComponent(previousMonth)}`}
      >
        <span aria-hidden="true">‹</span>
      </Link>
      <span aria-live="polite" className="month-label">
        {label}
      </span>
      {month < currentMonth ? (
        <Link
          aria-label="Next month"
          className="month-arrow"
          href={`/?month=${encodeURIComponent(nextMonth)}`}
        >
          <span aria-hidden="true">›</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="Next month unavailable"
          className="month-arrow is-disabled"
        >
          <span aria-hidden="true">›</span>
        </span>
      )}
    </nav>
  );
}
