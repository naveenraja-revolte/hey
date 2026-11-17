'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Courier = { id: number; name: string; email: string; phone: string };

export function CourierEditForm({ courier }: { courier: Courier }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(`/api/couriers/${courier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? 'Courier details could not be saved.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the courier service. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="relative">
      <summary className="rounded-control text-primary hover:bg-muted focus-visible:outline-ring inline-flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium focus-visible:outline-2">
        Edit details
      </summary>
      <form
        onSubmit={save}
        className="rounded-container border-border bg-card absolute right-0 z-20 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-4 border p-5 shadow-lg"
      >
        <h2 className="font-heading text-lg font-semibold">Edit {courier.name}</h2>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`name-${courier.id}`}>
          Name
          <input
            id={`name-${courier.id}`}
            name="name"
            defaultValue={courier.name}
            required
            maxLength={120}
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`email-${courier.id}`}>
          Email
          <input
            id={`email-${courier.id}`}
            name="email"
            type="email"
            defaultValue={courier.email}
            required
            maxLength={254}
            className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`phone-${courier.id}`}>
          Phone
          <input
            id={`phone-${courier.id}`}
            name="phone"
            type="tel"
            defaultValue={courier.phone}
            required
            maxLength={32}
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
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </details>
  );
}
