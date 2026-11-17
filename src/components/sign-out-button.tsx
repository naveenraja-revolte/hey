'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Sign out failed. Try again.');
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Sign out failed. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-destructive text-sm">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="rounded-control text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring min-h-11 px-3 text-sm font-medium transition-colors focus-visible:outline-2 disabled:opacity-60"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
