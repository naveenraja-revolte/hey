import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-primary text-sm font-semibold tracking-[0.12em] uppercase">
        Page not found
      </p>
      <h1 className="font-heading text-foreground mt-3 text-3xl font-semibold">
        This page is not part of the guide.
      </h1>
      <p className="text-muted-foreground mt-4 text-base leading-7">
        Head back to the introduction to explore AI and machine learning.
      </p>
      <Link
        className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-8 inline-flex min-h-12 w-fit items-center px-6 font-semibold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
        href="/"
      >
        Back to the guide
      </Link>
    </main>
  );
}
