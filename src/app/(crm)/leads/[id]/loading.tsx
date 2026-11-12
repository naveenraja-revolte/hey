export default function LeadDetailsLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading lead" className="space-y-5">
      <div className="h-9 w-56 animate-pulse rounded-control bg-muted" />
      <div className="h-64 animate-pulse rounded-container bg-muted" />
    </main>
  );
}
