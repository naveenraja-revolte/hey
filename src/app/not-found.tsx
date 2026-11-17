import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="rounded-container border-border bg-card w-full max-w-sm border p-6 text-center shadow-sm">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-base">
          The page you requested does not exist.
        </p>
        <Link
          href="/"
          className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background mt-6 inline-flex min-h-12 items-center px-4 text-base font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Return to calculator
        </Link>
      </section>
    </main>
  );
}
