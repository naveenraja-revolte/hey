import Link from 'next/link';
import { getDatabase } from '@/db';
import { CourierCreateForm } from '@/components/courier-create-form';
import { CourierTable } from '@/components/courier-table';
import { listCouriers } from '@/lib/couriers';
import { courierQuerySchema } from '@/lib/validation';

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CouriersPage({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const filters = courierQuerySchema.parse({
    q: Array.isArray(params.q) ? params.q[0] : params.q,
    page: Array.isArray(params.page) ? params.page[0] : params.page,
  });
  const result = await listCouriers(getDatabase(), filters);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Couriers
          </h1>
          <p className="text-muted-foreground text-pretty">
            Keep the roster current and balance active delivery work.
          </p>
        </div>
        <CourierCreateForm />
      </header>
      <form
        action="/couriers"
        role="search"
        className="rounded-container border-border bg-card flex flex-wrap items-end gap-3 border p-4"
      >
        <label className="grid min-w-64 flex-1 gap-1 text-sm font-medium" htmlFor="q">
          Search couriers
          <input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Name, email, or phone"
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-control border-border hover:bg-muted focus-visible:outline-ring min-h-11 border px-4 font-medium focus-visible:outline-2"
        >
          Search
        </button>
        {filters.q && (
          <Link
            href="/couriers"
            className="text-primary inline-flex min-h-11 items-center px-3 text-sm font-medium underline underline-offset-4"
          >
            Clear
          </Link>
        )}
      </form>
      <CourierTable result={result} query={filters} hasFilters={Boolean(filters.q)} />
    </div>
  );
}
