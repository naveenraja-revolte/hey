export default function Loading() {
  return (
    <main aria-busy="true" className="loading-shell">
      <span className="loading-indicator" />
      <span>Loading your workspace…</span>
    </main>
  );
}
