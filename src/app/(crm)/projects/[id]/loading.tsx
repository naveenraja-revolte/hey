export default function ProjectDetailsLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading project" className="space-y-5">
      <div className="h-9 w-56 animate-pulse rounded-control bg-muted" />
      <div className="h-64 animate-pulse rounded-container bg-muted" />
    </main>
  );
}
