'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? 'Sign in failed. Try again.');
        return;
      }
      router.replace('/deliveries');
      router.refresh();
    } catch {
      setError('Could not reach the sign-in service. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium" htmlFor="email">
        Work email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          className="rounded-control border-border bg-background focus-visible:outline-ring min-h-11 border px-3 text-base focus-visible:outline-2"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="password">
        Password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          maxLength={200}
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
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 w-full px-4 font-medium transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
