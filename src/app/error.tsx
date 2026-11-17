'use client';

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-sm rounded-[var(--radius-container)] border p-6 text-center shadow-sm">
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight text-balance">
          Calculator unavailable
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          Something went wrong. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-5 min-h-14 rounded-[var(--radius-control)] px-5 text-base font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
