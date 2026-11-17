import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="border-border bg-card w-full max-w-sm rounded-[var(--radius-container)] border p-6 text-center shadow-sm">
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight text-balance">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-3 text-base">That page is not available.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-5 inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] px-5 text-base font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
        >
          Go to calculator
        </Link>
      </section>
    </main>
  );
}
