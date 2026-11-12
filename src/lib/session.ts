import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAccountForSession, type Account } from './auth-service';
import { getOwnedWorkspace, listWorkspaces } from './workspace-service';

export const sessionCookieName = 'clientnest_session';
export const workspaceCookieName = 'clientnest_workspace';

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  return token ? getAccountForSession(token) : null;
}

export async function requireAccount(): Promise<Account> {
  const account = await currentAccount();
  if (!account) redirect('/login');
  return account;
}

export async function currentWorkspace(ownerId: string) {
  const store = await cookies();
  const selectedId = store.get(workspaceCookieName)?.value;
  const selected = selectedId ? getOwnedWorkspace(ownerId, selectedId) : undefined;
  if (selected) return selected;
  return listWorkspaces(ownerId)[0] ?? null;
}

export async function requireWorkspace(ownerId: string) {
  const workspace = await currentWorkspace(ownerId);
  if (!workspace) redirect('/workspaces');
  return workspace;
}

export async function assertSameOrigin(): Promise<void> {
  const requestHeaders = await headers();
  const site = requestHeaders.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') {
    throw new Error('Cross-site request blocked.');
  }
  const origin = requestHeaders.get('origin');
  const host = requestHeaders.get('host');
  if (origin && host && new URL(origin).host !== host) {
    throw new Error('Cross-site request blocked.');
  }
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(expiresAt),
    path: '/',
  });
}

export async function setWorkspaceCookie(workspaceId: string): Promise<void> {
  (await cookies()).set(workspaceCookieName, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
