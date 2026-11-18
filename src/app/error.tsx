'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="bg-background text-foreground grid min-h-dvh place-items-center px-4 py-8">
      <section className="rounded-container border-border bg-card w-full max-w-sm border p-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 text-base">
          The calculator could not be loaded. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-6 min-h-12 px-4 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
