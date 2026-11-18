import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-xl content-center px-4 py-12 text-center">
      <div className="rounded-container border-border bg-card space-y-4 border p-8 shadow-md">
        <h1 className="font-heading text-foreground text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground text-base leading-7">
          The page you requested does not exist.
        </p>
        <Link
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-12 items-center px-5 text-base font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/"
        >
          Return to the form
        </Link>
      </div>
    </main>
  );
}
