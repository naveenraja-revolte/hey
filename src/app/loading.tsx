export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading your expense ledger" className="ledger-shell">
      <header className="topbar">
        <span className="brand-name">daily ledger</span>
        <span className="local-badge">Loading your saved entries…</span>
      </header>
      <div aria-hidden="true" className="loading-panel" />
    </main>
  );
}
