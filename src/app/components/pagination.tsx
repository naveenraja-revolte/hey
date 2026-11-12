import Link from 'next/link';

export type PageResult = { page: number; pages: number; total: number };

export function Pagination({ result, searchParams }: { result: PageResult; searchParams: Record<string, string> }) {
  if (result.total === 0) return null;
  const start = (result.page - 1) * 20 + 1;
  const end = Math.min(result.page * 20, result.total);

  function pageHref(page: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(page) });
    return `?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>Showing {start} to {end} of {result.total}</span>
      <span className="flex items-center gap-3">
        {result.page > 1 && <Link className="min-h-11 content-center underline" rel="prev" href={pageHref(result.page - 1)}>Previous</Link>}
        <span aria-current="page" className="font-semibold text-foreground">Page {result.page} of {result.pages}</span>
        {result.page < result.pages && <Link className="min-h-11 content-center underline" href={pageHref(result.page + 1)}>Next</Link>}
      </span>
    </nav>
  );
}
