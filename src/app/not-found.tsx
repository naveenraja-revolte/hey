import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">Record not found</h1>
      <p className="text-muted-foreground">This delivery or courier may have been removed.</p>
      <Link
        href="/deliveries"
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-11 items-center px-4 focus-visible:outline-2"
      >
        Back to deliveries
      </Link>
    </main>
  );
}
