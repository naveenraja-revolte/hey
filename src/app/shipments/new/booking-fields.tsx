import { TextAreaField, TextField } from "@/components/form-fields";

type FieldErrors = Record<string, string>;

export function BookingFields({ fieldErrors }: { fieldErrors: FieldErrors }) {
  return (
    <>
      <fieldset className="grid gap-5">
        <legend className="mb-4 text-xl font-semibold">Sender</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="senderName"
            name="senderName"
            label="Sender full name (required)"
            autoComplete="name"
            required
            error={fieldErrors.senderName}
          />
          <TextField
            id="senderEmail"
            name="senderEmail"
            label="Sender email address (required)"
            type="email"
            autoComplete="email"
            required
            error={fieldErrors.senderEmail}
          />
          <TextField
            id="senderPhone"
            name="senderPhone"
            label="Phone number (optional)"
            type="tel"
            autoComplete="tel"
            error={fieldErrors.senderPhone}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              id="senderAddress"
              name="senderAddress"
              label="Pickup address (required)"
              autoComplete="street-address"
              required
              error={fieldErrors.senderAddress}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border-border grid gap-5 border-t pt-8">
        <legend className="mb-4 text-xl font-semibold">Recipient</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="recipientName"
            name="recipientName"
            label="Recipient full name (required)"
            autoComplete="name"
            required
            error={fieldErrors.recipientName}
          />
          <TextField
            id="recipientPhone"
            name="recipientPhone"
            label="Phone number (optional)"
            type="tel"
            autoComplete="tel"
            error={fieldErrors.recipientPhone}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              id="recipientAddress"
              name="recipientAddress"
              label="Delivery address (required)"
              autoComplete="street-address"
              required
              error={fieldErrors.recipientAddress}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border-border grid gap-5 border-t pt-8">
        <legend className="mb-4 text-xl font-semibold">Parcel</legend>
        <TextField
          id="parcelDescription"
          name="parcelDescription"
          label="Parcel contents (required)"
          required
          maxLength={160}
          error={fieldErrors.parcelDescription}
        />
      </fieldset>
    </>
  );
}
