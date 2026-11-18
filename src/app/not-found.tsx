import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-background text-foreground grid min-h-dvh place-items-center px-4 py-8">
      <section className="rounded-container border-border bg-card w-full max-w-sm border p-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
        <Link
          href="/"
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-6 inline-flex min-h-12 items-center px-4 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Return to calculator
        </Link>
      </section>
    </main>
  );
}
