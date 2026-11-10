import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { memberships } from '@/db/app-schema';
import { auth } from '@/lib/auth';

export type Viewer =
  | {
      id: string;
      name: string;
      email: string;
      role: 'admin';
      teamId: null;
    }
  | {
      id: string;
      name: string;
      email: string;
      role: 'member';
      teamId: string;
    }
  | {
      id: string;
      name: string;
      email: string;
      role: 'pending';
      teamId: null;
    };

export async function getCurrentViewer(): Promise<Viewer | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  if (session.user.role === 'admin') {
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'admin',
      teamId: null,
    };
  }

  if (session.user.role !== 'member') {
    return null;
  }

  const [membership] = db
    .select({ teamId: memberships.teamId })
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1)
    .all();

  if (!membership) {
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'pending',
      teamId: null,
    };
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: 'member',
    teamId: membership.teamId,
  };
}

export async function requireWorkspaceViewer(): Promise<Exclude<Viewer, { role: 'pending' }>> {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect('/login');
  }

  if (viewer.role === 'pending') {
    redirect('/pending');
  }

  return viewer;
}

export async function requireAdminViewer(): Promise<Extract<Viewer, { role: 'admin' }>> {
  const viewer = await requireWorkspaceViewer();

  if (viewer.role !== 'admin') {
    redirect('/tickets');
  }

  return viewer;
}
