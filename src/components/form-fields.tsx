import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClassName =
  "min-h-12 w-full rounded-control border border-border bg-card px-3 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-destructive text-sm" role="alert">
      {message}
    </p>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({
  label,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  if (!id) throw new Error("TextField requires an id.");
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-foreground font-medium">
        {label}
      </label>
      <input
        id={id}
        className={`${controlClassName} ${className ?? ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextAreaField({
  label,
  error,
  id,
  className,
  ...props
}: TextAreaFieldProps) {
  if (!id) throw new Error("TextAreaField requires an id.");
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-foreground font-medium">
        {label}
      </label>
      <textarea
        id={id}
        className={`${controlClassName} min-h-28 py-3 ${className ?? ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}
