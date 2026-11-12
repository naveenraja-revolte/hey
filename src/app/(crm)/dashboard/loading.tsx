export default function DashboardLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading overview" className="space-y-6">
      <div className="h-9 w-48 animate-pulse rounded-control bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={`stat-${index}`} className="h-28 animate-pulse rounded-container bg-muted" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div key={`list-${index}`} className="h-64 animate-pulse rounded-container bg-muted" />)}
      </div>
    </main>
  );
}
