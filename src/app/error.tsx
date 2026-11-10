'use client';

import { useEffect } from 'react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application route failed:', error);
  }, [error]);

  return (
    <main className="error-shell">
      <span className="eyebrow">Something went wrong</span>
      <h1>We couldn’t load this view.</h1>
      <p>Your saved ticket data is unchanged. Try again, or return to the queue.</p>
      <div className="form-actions">
        <button className="button button-primary" onClick={reset} type="button">Try again</button>
        <a className="button button-secondary" href="/tickets">Return to queue</a>
      </div>
    </main>
  );
}
