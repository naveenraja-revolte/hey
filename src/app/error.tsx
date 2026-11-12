'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8 text-center" role="alert">
      <h1 className="font-heading text-2xl font-semibold text-balance">Something went wrong</h1>
      <p className="text-muted-foreground">We couldn’t load this page. Your saved data is safe.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-control bg-primary px-4 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        Try again
      </button>
    </main>
  );
}
