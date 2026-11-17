'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function CourierCreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch('/api/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? 'Courier could not be saved. Try again.');
        return;
      }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError('Could not reach the courier service. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="relative"
    >
      <summary className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-11 cursor-pointer list-none items-center px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
        Add courier
      </summary>
      <form
        ref={formRef}
        onSubmit={save}
        className="rounded-container border-border bg-card absolute right-0 z-20 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-4 border p-5 shadow-lg"
      >
        <h2 className="font-heading text-lg font-semibold">New courier</h2>
        <label className="grid gap-1 text-sm font-medium" htmlFor="courier-name">
          Name
          <input
            id="courier-name"
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor="courier-email">
          Email
          <input
            id="courier-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor="courier-phone">
          Phone
          <input
            id="courier-phone"
            name="phone"
            type="tel"
            required
            maxLength={32}
            autoComplete="tel"
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 px-4 font-medium focus-visible:outline-2 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save courier'}
        </button>
      </form>
    </details>
  );
}
