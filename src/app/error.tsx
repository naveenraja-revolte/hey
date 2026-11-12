'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('The expense ledger could not load.', error);
  }, [error]);

  return (
    <main className="ledger-shell">
      <section aria-labelledby="error-title" className="error-panel">
        <p className="eyebrow">A TEMPORARY INTERRUPTION</p>
        <h1 id="error-title">Your ledger is still here.</h1>
        <p>We could not load it just now. Your saved entries have not been changed.</p>
        <button className="button button-primary" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
