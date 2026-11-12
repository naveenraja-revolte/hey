'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clientSchema, leadSchema, projectSchema } from '@/lib/domain';
import { fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { convertLead, deleteClient, deleteLead, deleteProject, saveClient, saveLead, saveProject } from '@/lib/crm-mutations';
import { assertSameOrigin, requireAccount, requireWorkspace } from '@/lib/session';

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

function publicError(error: unknown): string {
  if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
    return 'A client with this email already exists in this workspace.';
  }
  if (error instanceof Error && /not found|choose a client|convert action|lost lead|projects before|converted lead record/i.test(error.message)) {
    return error.message;
  }
  console.error('CRM change failed.', error);
  return 'We could not save this change. Check the details and try again.';
}

export async function saveClientAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  const parsed = clientSchema.safeParse({
    name: text(formData, 'name'), email: text(formData, 'email'), phone: text(formData, 'phone'),
    company: text(formData, 'company'), notes: text(formData, 'notes'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const clientId = text(formData, 'clientId') || undefined;
  try {
    saveClient(workspace.id, parsed.data, clientId);
  } catch (error) {
    return { error: publicError(error) };
  }
  revalidatePath('/clients');
  redirect('/clients');
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  try {
    deleteClient(workspace.id, text(formData, 'id'));
  } catch (error) {
    redirect(`/clients?error=${encodeURIComponent(publicError(error))}`);
  }
  revalidatePath('/clients');
  redirect('/clients');
}

export async function saveLeadAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  const parsed = leadSchema.safeParse({
    name: text(formData, 'name'), email: text(formData, 'email'), phone: text(formData, 'phone'),
    company: text(formData, 'company'), source: text(formData, 'source'), status: text(formData, 'status'),
    notes: text(formData, 'notes'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const leadId = text(formData, 'leadId') || undefined;
  try {
    saveLead(workspace.id, parsed.data, leadId);
  } catch (error) {
    return { error: publicError(error) };
  }
  revalidatePath('/leads');
  redirect('/leads');
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  try {
    deleteLead(workspace.id, text(formData, 'id'));
  } catch (error) {
    redirect(`/leads?error=${encodeURIComponent(publicError(error))}`);
  }
  revalidatePath('/leads');
  redirect('/leads');
}

export async function convertLeadAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  let clientId: string;
  try {
    clientId = convertLead(workspace.id, text(formData, 'id'));
  } catch (error) {
    redirect(`/leads?error=${encodeURIComponent(publicError(error))}`);
  }
  revalidatePath('/leads');
  revalidatePath('/clients');
  redirect(`/clients/${clientId}`);
}

export async function saveProjectAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  const parsed = projectSchema.safeParse({
    name: text(formData, 'name'), clientId: text(formData, 'clientId'),
    description: text(formData, 'description'), budget: text(formData, 'budget'),
    deadline: text(formData, 'deadline'), status: text(formData, 'status'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const projectId = text(formData, 'projectId') || undefined;
  try {
    saveProject(workspace.id, parsed.data, projectId);
  } catch (error) {
    return { error: publicError(error) };
  }
  revalidatePath('/projects');
  redirect('/projects');
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const account = await requireAccount();
  const workspace = await requireWorkspace(account.id);
  try {
    deleteProject(workspace.id, text(formData, 'id'));
  } catch (error) {
    redirect(`/projects?error=${encodeURIComponent(publicError(error))}`);
  }
  revalidatePath('/projects');
  redirect('/projects');
}
