import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Check, Clock3, Package } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getDatabase } from "@/db/database";
import { getShipmentByTrackingNumber } from "@/lib/shipment-service";
import { shipmentStatusLabels } from "@/lib/shipment-status";

type TrackingPageProps = {
  params: Promise<{ trackingNumber: string }>;
  searchParams: Promise<{ created?: string }>;
};

const eventTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export async function generateMetadata({ params }: TrackingPageProps) {
  const { trackingNumber } = await params;
  return {
    title: `Tracking ${trackingNumber.toUpperCase()} | Parcel delivery`,
  };
}

export default async function TrackingPage({
  params,
  searchParams,
}: TrackingPageProps) {
  await connection();
  const [{ trackingNumber }, query] = await Promise.all([params, searchParams]);
  const shipment = getShipmentByTrackingNumber(
    getDatabase().db,
    trackingNumber,
  );
  if (!shipment) notFound();

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
    >
      {query.created === "1" && (
        <p
          className="rounded-control border-success/30 bg-success/10 text-success mb-6 border p-4"
          role="status"
        >
          Your parcel is registered. Save this tracking number to check its
          progress later.
        </p>
      )}
      <header className="animate-fade-in-up rounded-container border-border bg-card border p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Tracking number
            </p>
            <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {shipment.trackingNumber}
            </h1>
          </div>
          <StatusBadge status={shipment.status} />
        </div>
        <p className="text-muted-foreground mt-5 max-w-2xl leading-7 text-pretty">
          Your parcel is currently{" "}
          <span className="text-foreground font-medium">
            {shipmentStatusLabels[shipment.status].toLowerCase()}
          </span>
          . Updates are recorded by the delivery team.
        </p>
      </header>

      <section
        aria-labelledby="history-heading"
        className="animate-fade-in-up rounded-container border-border bg-card mt-8 border p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-control bg-muted text-primary flex size-10 items-center justify-center">
            <Clock3 aria-hidden className="size-5" />
          </span>
          <div>
            <h2
              id="history-heading"
              className="font-heading text-xl font-semibold"
            >
              Delivery history
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Most recent update:{" "}
              {eventTime.format(new Date(shipment.updatedAt))} UTC
            </p>
          </div>
        </div>
        <ol className="grid gap-0">
          {shipment.events.map((event, index) => (
            <li
              key={event.id}
              className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-7 last:pb-0"
            >
              {index < shipment.events.length - 1 && (
                <span
                  className="bg-border absolute top-10 bottom-0 left-5 w-px"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex size-10 items-center justify-center rounded-full ${index === shipment.events.length - 1 ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}
              >
                {index === shipment.events.length - 1 ? (
                  <Package aria-hidden className="size-5" />
                ) : (
                  <Check aria-hidden className="size-5" />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold">
                    {shipmentStatusLabels[event.status]}
                  </h3>
                  {index === shipment.events.length - 1 && (
                    <span className="text-primary text-sm font-medium">
                      Latest
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 leading-6 text-pretty">
                  {event.message}
                </p>
                <time
                  dateTime={event.occurredAt}
                  className="text-muted-foreground mt-2 block text-sm"
                >
                  {eventTime.format(new Date(event.occurredAt))} UTC
                </time>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="text-muted-foreground mt-5 text-sm">
        Shipment addresses and contact details are kept private.
      </p>
    </main>
  );
}
