import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { DomainError } from '@/lib/action-result';

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUserId() {
  const currentSession = await getCurrentSession();

  if (!currentSession?.user.id) {
    throw new DomainError('Sign in to continue.');
  }

  return currentSession.user.id;
}
