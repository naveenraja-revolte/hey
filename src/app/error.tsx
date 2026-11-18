'use client';

import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="rounded-container border-border bg-card w-full max-w-sm space-y-4 border p-6 text-center"
        aria-labelledby="error-title"
      >
        <h1 id="error-title" className="font-heading text-2xl font-semibold">
          Calculator unavailable
        </h1>
        <p className="text-muted-foreground text-base">
          Something went wrong. Try loading the calculator again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring min-h-12 px-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
