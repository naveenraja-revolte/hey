export default function ClientDetailsLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading client" className="space-y-5">
      <div className="h-9 w-56 animate-pulse rounded-control bg-muted" />
      <div className="h-40 animate-pulse rounded-container bg-muted" />
      <div className="h-48 animate-pulse rounded-container bg-muted" />
    </main>
  );
}
