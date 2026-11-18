'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="font-heading text-foreground text-3xl font-semibold">
        This page could not be loaded.
      </h1>
      <p className="text-muted-foreground mt-4 text-base leading-7">
        Please try again. The guide will still be here.
      </p>
      <button
        className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-8 min-h-12 w-fit px-6 font-semibold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
        onClick={() => reset()}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
