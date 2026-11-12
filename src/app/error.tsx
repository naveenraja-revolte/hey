'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application page failed', error);
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">A MOMENTARY PAUSE</p>
        <h1>That page didn’t open.</h1>
        <p className="auth-intro">Your saved work is still safe. Try again in a moment.</p>
        <button className="button button-primary" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
