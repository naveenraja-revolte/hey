'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCurrentViewer } from '@/lib/viewer';

export async function signOutAction() {
  const viewer = await getCurrentViewer();

  if (viewer) {
    await auth.api.signOut({ headers: await headers() });
  }

  redirect('/login');
}
