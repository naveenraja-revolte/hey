import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
    >
      <section className="animate-fade-in-up max-w-2xl">
        <h1 className="font-heading max-w-xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          Send with confidence. Follow every step.
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-8 text-pretty">
          Register a parcel in a few minutes, then check its progress from
          collection to delivery.
        </p>
        <Link
          href="/shipments/new"
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring mt-8 inline-flex min-h-12 items-center gap-2 px-5 font-semibold transition hover:opacity-90 focus-visible:outline-2 active:scale-[0.98]"
        >
          Send a parcel <ArrowRight aria-hidden className="size-4" />
        </Link>
      </section>

      <section
        id="track"
        className="animate-fade-in-up rounded-container border-border bg-card border p-6 shadow-sm sm:p-8"
      >
        <div className="rounded-control bg-muted text-primary mb-6 flex size-12 items-center justify-center">
          <PackageCheck aria-hidden className="size-6" />
        </div>
        <h2 className="font-heading text-2xl font-semibold">Track a parcel</h2>
        <p className="text-muted-foreground mt-2 leading-7 text-pretty">
          Enter the tracking number shared by the sender to see the latest
          update.
        </p>
        <form action="/track" method="get" className="mt-6 grid gap-4">
          <label htmlFor="trackingNumber" className="font-medium">
            Tracking number (required)
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            required
            minLength={8}
            maxLength={32}
            autoCapitalize="characters"
            autoComplete="off"
            className="rounded-control border-border bg-background focus-visible:ring-ring min-h-12 border px-3 text-base uppercase transition outline-none focus-visible:ring-2"
            placeholder="PD-..."
          />
          <button
            type="submit"
            className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 px-5 font-semibold transition hover:opacity-90 focus-visible:outline-2 active:scale-[0.98]"
          >
            Find my parcel
          </button>
        </form>
      </section>
    </main>
  );
}
