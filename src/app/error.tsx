'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">This page could not load</h1>
      <p className="text-muted-foreground">Your delivery data is safe. Try again in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 px-4 focus-visible:outline-2"
      >
        Try again
      </button>
    </main>
  );
}
