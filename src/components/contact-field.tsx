import type { ContactFormField } from '@/lib/contact-form-schema';

type ContactFieldProps = {
  field: ContactFormField;
  label: string;
  value: string;
  error?: string;
  maxLength: number;
  type?: 'text' | 'email';
  autoComplete?: string;
  multiline?: boolean;
  onChange: (field: ContactFormField, value: string) => void;
  onBlur: (field: ContactFormField, value: string) => void;
};

export function ContactField({
  field,
  label,
  value,
  error,
  maxLength,
  type = 'text',
  autoComplete,
  multiline = false,
  onChange,
  onBlur,
}: ContactFieldProps) {
  const fieldId = `${field}-error`;
  const commonProps = {
    id: field,
    maxLength,
    name: field,
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onBlur(field, event.currentTarget.value),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, event.currentTarget.value),
    required: true,
    'aria-describedby': error ? fieldId : undefined,
    'aria-invalid': Boolean(error),
    value,
  };

  return (
    <div className="space-y-2">
      <label className="text-foreground block text-base font-medium" htmlFor={field}>
        {label} <span className="text-destructive">(required)</span>
      </label>
      {multiline ? (
        <textarea
          {...commonProps}
          className="rounded-control border-border bg-background text-foreground focus-visible:ring-ring aria-invalid:border-destructive min-h-36 w-full resize-y border px-4 py-3 text-base leading-7 transition outline-none focus-visible:ring-2"
        />
      ) : (
        <input
          {...commonProps}
          autoComplete={autoComplete}
          className="rounded-control border-border bg-background text-foreground focus-visible:ring-ring aria-invalid:border-destructive min-h-12 w-full border px-4 text-base transition outline-none focus-visible:ring-2"
          type={type}
        />
      )}
      {error && (
        <p className="text-destructive text-sm" id={fieldId}>
          {error}
        </p>
      )}
    </div>
  );
}
