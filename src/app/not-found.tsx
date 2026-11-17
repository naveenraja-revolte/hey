import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-xl justify-items-center gap-4 px-4 py-20 text-center"
    >
      <h1 className="font-heading text-2xl font-semibold">
        We could not find that parcel
      </h1>
      <p className="text-muted-foreground leading-7 text-pretty">
        Check the tracking number and try again. Tracking numbers are not
        case-sensitive.
      </p>
      <Link
        href="/#track"
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 px-5 py-3 font-semibold focus-visible:outline-2"
      >
        Track a parcel
      </Link>
    </main>
  );
}
