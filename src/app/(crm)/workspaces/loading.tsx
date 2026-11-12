export default function WorkspacesLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading workspaces" className="space-y-5">
      <div className="h-9 w-48 animate-pulse rounded-control bg-muted" />
      <div className="h-28 animate-pulse rounded-container bg-muted" />
      <div className="h-48 animate-pulse rounded-container bg-muted" />
    </main>
  );
}
