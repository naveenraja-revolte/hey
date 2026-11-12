'use server';

import { redirect } from 'next/navigation';
import { loginSchema, registrationSchema } from '@/lib/domain';
import { authenticateAccount, createSession, registerAccount, revokeSession } from '@/lib/auth-service';
import { fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { assertSameOrigin, sessionCookieName, setSessionCookie, setWorkspaceCookie } from '@/lib/session';
import { listWorkspaces } from '@/lib/workspace-service';
import { cookies } from 'next/headers';

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const parsed = registrationSchema.safeParse({
    name: textValue(formData, 'name'),
    email: textValue(formData, 'email'),
    password: textValue(formData, 'password'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const account = await registerAccount(parsed.data);
    const session = createSession(account.id);
    await setSessionCookie(session.token, session.expiresAt);
    const workspace = listWorkspaces(account.id)[0];
    if (workspace) await setWorkspaceCookie(workspace.id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return { error: 'An account with this email already exists.' };
    }
    console.error('Account registration failed.', error);
    return { error: 'We could not create your account. Try again.' };
  }
  redirect('/');
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const parsed = loginSchema.safeParse({
    email: textValue(formData, 'email'),
    password: textValue(formData, 'password'),
  });
  if (!parsed.success) return { error: 'Enter a valid email and password.' };

  const account = await authenticateAccount(parsed.data.email, parsed.data.password);
  if (!account) return { error: 'Invalid email or password.' };
  const session = createSession(account.id);
  await setSessionCookie(session.token, session.expiresAt);
  const workspace = listWorkspaces(account.id)[0];
  if (workspace) await setWorkspaceCookie(workspace.id);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await assertSameOrigin();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) revokeSession(token);
  cookieStore.delete(sessionCookieName);
  cookieStore.delete('clientnest_workspace');
  redirect('/login');
}

