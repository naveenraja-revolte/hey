"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-xl justify-items-center gap-4 px-4 py-20 text-center"
    >
      <h1 className="font-heading text-2xl font-semibold">
        We could not load that page
      </h1>
      <p className="text-muted-foreground leading-7 text-pretty">
        Your shipment details are safe. Try again, or return to parcel tracking.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 px-5 font-semibold focus-visible:outline-2"
      >
        Try again
      </button>
    </main>
  );
}
