'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error('Contact form route failed to render.', error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-xl content-center px-4 py-12 text-center">
      <div className="rounded-container border-border bg-card space-y-4 border p-8 shadow-md">
        <h1 className="font-heading text-foreground text-2xl font-semibold">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-base leading-7">
          We could not load the form. Please try again.
        </p>
        <button
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 px-5 text-base font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => retry()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
