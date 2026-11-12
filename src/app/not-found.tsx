import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8 text-center">
      <h1 className="font-heading text-2xl font-semibold">Record not found</h1>
      <p className="text-muted-foreground">This record may have been removed or belongs to another workspace.</p>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-primary-foreground">
        Back to overview
      </Link>
    </main>
  );
}
