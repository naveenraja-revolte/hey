import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingForm } from "@/app/shipments/new/booking-form";

export const metadata = { title: "Send a parcel | Parcel delivery" };

export default function NewShipmentPage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
    >
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground focus-visible:outline-ring mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium focus-visible:outline-2"
      >
        <ArrowLeft aria-hidden className="size-4" /> Back to tracking
      </Link>
      <header className="animate-fade-in-up mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Register a parcel
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7 text-pretty">
          Add pickup, delivery, and parcel details. A tracking number is created
          when you register.
        </p>
      </header>
      <section className="animate-fade-in-up rounded-container border-border bg-card border p-5 shadow-sm sm:p-8">
        <BookingForm />
      </section>
    </main>
  );
}
