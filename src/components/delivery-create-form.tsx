'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DeliveryFields } from './delivery-fields';

type ApiError = { error?: string; fieldErrors?: Record<string, string> };

export function DeliveryCreateForm() {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setMessage('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = (await response.json()) as ApiError & { id?: number };
      if (!response.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.error ?? 'Delivery could not be saved. Check the fields and try again.');
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      router.push(`/deliveries/${result.id}`);
      router.refresh();
    } catch {
      setMessage('Could not reach the delivery service. Your entries are still here; try again.');
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-container border-border bg-card space-y-6 border p-5 sm:p-6"
    >
      {message && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-control border-destructive/40 bg-destructive/10 text-destructive border p-3 text-sm"
        >
          {message}
        </div>
      )}
      <DeliveryFields errors={errors} />
      <div className="border-border flex flex-wrap justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={() => router.push('/deliveries')}
          className="rounded-control text-muted-foreground hover:bg-muted focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 px-5 font-medium transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Create delivery'}
        </button>
      </div>
    </form>
  );
}
