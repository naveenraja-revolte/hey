'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="rounded-container border-border bg-card w-full max-w-sm border p-6 text-center shadow-sm"
        role="alert"
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Calculator unavailable
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Something went wrong. Try loading the calculator again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background mt-6 min-h-12 px-4 text-base font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
