import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="rounded-container border-border bg-card w-full max-w-sm space-y-4 border p-6 text-center"
        aria-labelledby="not-found-title"
      >
        <h1 id="not-found-title" className="font-heading text-2xl font-semibold">
          Page not found
        </h1>
        <p className="text-muted-foreground text-base">
          The calculator is available from the home page.
        </p>
        <Link
          href="/"
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-12 items-center px-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open calculator
        </Link>
      </section>
    </main>
  );
}
