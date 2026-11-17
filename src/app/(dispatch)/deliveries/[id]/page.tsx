import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/db';
import { DeliveryControls } from '@/components/delivery-controls';
import { listActiveCouriers } from '@/lib/couriers';
import { getDelivery } from '@/lib/deliveries';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/lib/domain';
import { deliveryCode, formatDateTime } from '@/lib/format';
import { AppError } from '@/lib/errors';

export default async function DeliveryDetailPage({ params }: PageProps<'/deliveries/[id]'>) {
  const { id } = await params;
  const deliveryId = Number(id);
  if (!Number.isSafeInteger(deliveryId) || deliveryId < 1) notFound();
  const db = getDatabase();
  let delivery;
  try {
    delivery = await getDelivery(db, deliveryId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const couriers = await listActiveCouriers(db);

  return (
    <div className="space-y-6">
      <Link
        href="/deliveries"
        className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
      >
        Back to deliveries
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground font-mono text-sm">{deliveryCode(delivery.id)}</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {delivery.recipientName}
          </h1>
          <p className="text-muted-foreground">Created {formatDateTime(delivery.createdAt)}</p>
        </div>
        <span
          className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm font-medium ${STATUS_BADGE_CLASSES[delivery.status]}`}
        >
          {STATUS_LABELS[delivery.status]}
        </span>
      </header>
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-5">
          <article className="rounded-container border-border bg-card grid gap-5 border p-5 sm:grid-cols-2">
            <div className="space-y-1">
              <h2 className="text-muted-foreground text-sm font-medium">Pickup</h2>
              <p className="text-pretty">{delivery.pickupAddress}</p>
            </div>
            <div className="space-y-1">
              <h2 className="text-muted-foreground text-sm font-medium">Drop-off</h2>
              <p className="text-pretty">{delivery.dropoffAddress}</p>
            </div>
            <div className="space-y-1">
              <h2 className="text-muted-foreground text-sm font-medium">Recipient phone</h2>
              <p>{delivery.recipientPhone}</p>
            </div>
            <div className="space-y-1">
              <h2 className="text-muted-foreground text-sm font-medium">Parcel</h2>
              <p className="text-pretty">{delivery.parcelDescription}</p>
            </div>
            {delivery.notes && (
              <div className="space-y-1 sm:col-span-2">
                <h2 className="text-muted-foreground text-sm font-medium">Dispatch notes</h2>
                <p className="text-pretty">{delivery.notes}</p>
              </div>
            )}
          </article>
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">Delivery history</h2>
            <ol className="rounded-container border-border bg-card space-y-3 border p-5">
              {delivery.history.map((event) => (
                <li key={event.id} className="border-primary/30 flex gap-3 border-l-2 pl-4">
                  <span
                    className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{STATUS_LABELS[event.status]}</p>
                    {event.note && <p className="text-muted-foreground">{event.note}</p>}
                    <time
                      className="text-muted-foreground text-sm"
                      dateTime={new Date(event.createdAt).toISOString()}
                    >
                      {formatDateTime(event.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </section>
        <DeliveryControls delivery={delivery} couriers={couriers} />
      </div>
    </div>
  );
}
