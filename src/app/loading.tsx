export default function Loading() {
  return (
    <main aria-busy="true" className="app-shell loading-shell">
      <div className="loading-bar" />
      <p className="eyebrow">OPENING YOUR NOTES</p>
      <div className="loading-skeleton" />
    </main>
  );
}
