import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center px-6 py-16">
      <p className="text-primary text-sm font-semibold tracking-[0.12em] uppercase">404</p>
      <h1 className="font-heading text-foreground mt-3 text-3xl font-semibold">
        This page is not here.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-prose text-base leading-7">
        The guide lives on one page. Head back to the introduction to keep exploring.
      </p>
      <Link
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-6 inline-flex min-h-11 items-center rounded-full px-6 py-3 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        href="/"
      >
        Go to the introduction
      </Link>
    </main>
  );
}
