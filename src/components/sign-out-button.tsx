'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const result = await authClient.signOut();
      if (result.error) {
        console.error('Sign out failed', result.error);
        return;
      }
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <button className="button button-quiet" disabled={pending} onClick={signOut} type="button">
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
