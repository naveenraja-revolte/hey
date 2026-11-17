"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { BookingFields } from "@/app/shipments/new/booking-fields";

export function BookingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submitShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setFieldErrors({});

    try {
      const body = Object.fromEntries(
        new FormData(event.currentTarget).entries(),
      );
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        error?: string;
        fields?: Record<string, string[] | undefined>;
        trackingNumber?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Check the shipment details and try again.");
        setFieldErrors(
          Object.fromEntries(
            Object.entries(result.fields ?? {}).flatMap(([name, messages]) =>
              messages?.[0] ? [[name, messages[0]]] : [],
            ),
          ),
        );
        return;
      }
      if (!result.trackingNumber)
        throw new Error("The tracking number was not returned.");
      router.push(
        `/track/${encodeURIComponent(result.trackingNumber)}?created=1`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not register the parcel.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submitShipment} className="grid gap-8" noValidate>
      {error && (
        <div
          className="rounded-container border-destructive/30 bg-destructive/10 text-destructive border p-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <BookingFields fieldErrors={fieldErrors} />

      <div className="border-border flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-muted-foreground text-sm">
          We’ll create a tracking number after registration.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 px-5 font-semibold transition hover:opacity-90 focus-visible:outline-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Registering…" : "Register parcel"}
          {!pending && <ArrowRight aria-hidden className="size-4" />}
        </button>
      </div>
    </form>
  );
}
