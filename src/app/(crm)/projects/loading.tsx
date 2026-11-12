export default function ProjectsLoading() {
  return (
    <main role="status" aria-busy="true" aria-label="Loading projects" className="space-y-5">
      <div className="h-9 w-40 animate-pulse rounded-control bg-muted" />
      <div className="h-20 animate-pulse rounded-container bg-muted" />
      <div className="space-y-2">{Array.from({ length: 6 }, (_, index) => <div key={`row-${index}`} className="h-12 animate-pulse rounded-control bg-muted" />)}</div>
    </main>
  );
}
