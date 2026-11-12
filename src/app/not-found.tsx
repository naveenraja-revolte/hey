import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="ledger-shell">
      <section aria-labelledby="not-found-title" className="error-panel">
        <p className="eyebrow">NOTHING ON THIS PAGE</p>
        <h1 id="not-found-title">That page is not in the ledger.</h1>
        <p>Return to your monthly spending view and pick up where you left off.</p>
        <Link className="button button-primary" href="/">
          Back to the ledger
        </Link>
      </section>
    </main>
  );
}
