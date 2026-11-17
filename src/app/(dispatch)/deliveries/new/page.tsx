import Link from 'next/link';
import { DeliveryCreateForm } from '@/components/delivery-create-form';

export default function NewDeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/deliveries"
        className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
      >
        Back to deliveries
      </Link>
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">New delivery</h1>
        <p className="text-muted-foreground text-pretty">
          Record recipient, parcel, pickup, and drop-off details.
        </p>
      </header>
      <DeliveryCreateForm />
    </div>
  );
}
