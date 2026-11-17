const fieldClassName =
  'min-h-11 rounded-control border border-border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring';

export function DeliveryFields({ errors }: { errors: Record<string, string> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium" htmlFor="recipientName">
        Recipient name <span className="sr-only">(required)</span>
        <input
          id="recipientName"
          name="recipientName"
          required
          maxLength={120}
          className={fieldClassName}
          aria-invalid={Boolean(errors.recipientName)}
          aria-describedby={errors.recipientName ? 'recipientName-error' : undefined}
        />
        {errors.recipientName && (
          <span id="recipientName-error" className="text-destructive font-normal">
            {errors.recipientName}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="recipientPhone">
        Recipient phone <span className="sr-only">(required)</span>
        <input
          id="recipientPhone"
          name="recipientPhone"
          type="tel"
          autoComplete="tel"
          required
          maxLength={32}
          className={fieldClassName}
          aria-invalid={Boolean(errors.recipientPhone)}
          aria-describedby={errors.recipientPhone ? 'recipientPhone-error' : undefined}
        />
        {errors.recipientPhone && (
          <span id="recipientPhone-error" className="text-destructive font-normal">
            {errors.recipientPhone}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2" htmlFor="pickupAddress">
        Pickup address <span className="sr-only">(required)</span>
        <input
          id="pickupAddress"
          name="pickupAddress"
          autoComplete="street-address"
          required
          maxLength={300}
          className={fieldClassName}
          aria-invalid={Boolean(errors.pickupAddress)}
          aria-describedby={errors.pickupAddress ? 'pickupAddress-error' : undefined}
        />
        {errors.pickupAddress && (
          <span id="pickupAddress-error" className="text-destructive font-normal">
            {errors.pickupAddress}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2" htmlFor="dropoffAddress">
        Drop-off address <span className="sr-only">(required)</span>
        <input
          id="dropoffAddress"
          name="dropoffAddress"
          required
          maxLength={300}
          className={fieldClassName}
          aria-invalid={Boolean(errors.dropoffAddress)}
          aria-describedby={errors.dropoffAddress ? 'dropoffAddress-error' : undefined}
        />
        {errors.dropoffAddress && (
          <span id="dropoffAddress-error" className="text-destructive font-normal">
            {errors.dropoffAddress}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2" htmlFor="parcelDescription">
        Parcel description <span className="sr-only">(required)</span>
        <input
          id="parcelDescription"
          name="parcelDescription"
          required
          maxLength={240}
          className={fieldClassName}
          aria-invalid={Boolean(errors.parcelDescription)}
          aria-describedby={errors.parcelDescription ? 'parcelDescription-error' : undefined}
        />
        {errors.parcelDescription && (
          <span id="parcelDescription-error" className="text-destructive font-normal">
            {errors.parcelDescription}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2" htmlFor="notes">
        Dispatch notes <span className="text-muted-foreground font-normal">(optional)</span>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          className="rounded-control border-border bg-background focus-visible:outline-ring border px-3 py-2 text-base focus-visible:outline-2"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
        />
        {errors.notes && (
          <span id="notes-error" className="text-destructive font-normal">
            {errors.notes}
          </span>
        )}
      </label>
    </div>
  );
}
