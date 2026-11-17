'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center px-6 py-16">
      <h1 className="font-heading text-foreground text-3xl font-semibold">
        This page could not be loaded.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-prose text-base leading-7">
        Please try again. The guide will be here when the page is ready.
      </p>
      <button
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-6 min-h-11 rounded-full px-6 py-3 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
