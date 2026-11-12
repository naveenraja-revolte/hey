'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { workspaceSchema } from '@/lib/domain';
import { fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { assertSameOrigin, currentWorkspace, requireAccount, setWorkspaceCookie } from '@/lib/session';
import { createWorkspace, deleteWorkspaceIfEmpty, getOwnedWorkspace, listWorkspaces, renameWorkspace } from '@/lib/workspace-service';

function formText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '');
}

export async function createWorkspaceAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const account = await requireAccount();
  const parsed = workspaceSchema.safeParse({ name: formText(formData, 'name') });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const id = createWorkspace(account.id, parsed.data.name);
  await setWorkspaceCookie(id);
  revalidatePath('/');
  redirect('/');
}

export async function renameWorkspaceAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await currentWorkspace(account.id);
  if (!workspace) return { error: 'Create a workspace before renaming it.' };
  const parsed = workspaceSchema.safeParse({ name: formText(formData, 'name') });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  if (!renameWorkspace(account.id, workspace.id, parsed.data.name)) return { error: 'Workspace not found.' };
  revalidatePath('/', 'layout');
  return {};
}

export async function selectWorkspaceAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspaceId = formText(formData, 'workspaceId');
  const workspace = getOwnedWorkspace(account.id, workspaceId);
  if (!workspace) throw new Error('Workspace not found.');
  await setWorkspaceCookie(workspace.id);
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function deleteWorkspaceAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspaceId = formText(formData, 'workspaceId');
  const result = deleteWorkspaceIfEmpty(account.id, workspaceId);
  if (result === 'not-found') throw new Error('Workspace not found.');
  if (result === 'contains-records') redirect('/workspaces?error=workspace-not-empty');

  const nextWorkspace = listWorkspaces(account.id)[0];
  if (nextWorkspace) await setWorkspaceCookie(nextWorkspace.id);
  else redirect('/workspaces');
  revalidatePath('/', 'layout');
  redirect('/');
}

