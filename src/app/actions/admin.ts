'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentViewer } from '@/lib/viewer';
import {
  assignMemberToTeam,
  createTeam,
  createTopic,
  isTeamNameAvailable,
  isTopicNameAvailable,
  renameTeam,
  renameTopic,
  setTopicActive,
} from '@/services/admin.service';

export type AdminActionState = {
  kind: 'success' | 'error';
  message: string;
} | null;

const nameSchema = z.string().trim().min(2, 'Use at least 2 characters.').max(80, 'Use no more than 80 characters.');
const idSchema = z.string().uuid();

async function requireAdmin(): Promise<AdminActionState | null> {
  const viewer = await getCurrentViewer();
  return viewer?.role === 'admin'
    ? null
    : { kind: 'error', message: 'Administrator access is required for this change.' };
}

function reportFailure(error: unknown, fallback: string): AdminActionState {
  console.error('Admin configuration change failed:', error);
  return {
    kind: 'error',
    message: error instanceof Error && error.message.startsWith('Choose an existing')
      ? error.message
      : fallback,
  };
}

export async function createTeamAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = nameSchema.safeParse(formData.get('name'));
  if (!parsed.success) return { kind: 'error', message: parsed.error.issues[0]?.message ?? 'Enter a team name.' };
  if (!isTeamNameAvailable(parsed.data)) return { kind: 'error', message: 'A team with that name already exists.' };

  try {
    createTeam(parsed.data);
    revalidatePath('/admin');
    return { kind: 'success', message: 'Team created.' };
  } catch (error) {
    return reportFailure(error, 'The team could not be created. Please try again.');
  }
}

export async function renameTeamAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = z.object({ id: idSchema, name: nameSchema }).safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Enter a valid team name.' };
  if (!isTeamNameAvailable(parsed.data.name, parsed.data.id)) {
    return { kind: 'error', message: 'A team with that name already exists.' };
  }

  try {
    renameTeam(parsed.data.id, parsed.data.name);
    revalidatePath('/admin');
    revalidatePath('/tickets');
    return { kind: 'success', message: 'Team name updated.' };
  } catch (error) {
    return reportFailure(error, 'The team could not be updated. Please try again.');
  }
}

export async function createTopicAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = z.object({ name: nameSchema, teamId: idSchema }).safeParse({
    name: formData.get('name'),
    teamId: formData.get('teamId'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Enter a topic and select its team.' };
  if (!isTopicNameAvailable(parsed.data.name, parsed.data.teamId)) {
    return { kind: 'error', message: 'That topic already exists for this team.' };
  }

  try {
    createTopic(parsed.data.name, parsed.data.teamId);
    revalidatePath('/admin');
    revalidatePath('/tickets/new');
    return { kind: 'success', message: 'Topic created and routed to its team.' };
  } catch (error) {
    return reportFailure(error, 'The topic could not be created. Check the selected team.');
  }
}

export async function renameTopicAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = z.object({ id: idSchema, name: nameSchema }).safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Enter a valid topic name.' };

  try {
    renameTopic(parsed.data.id, parsed.data.name);
    revalidatePath('/admin');
    revalidatePath('/tickets/new');
    return { kind: 'success', message: 'Topic name updated.' };
  } catch (error) {
    return reportFailure(error, 'The topic could not be updated. Please try again.');
  }
}

export async function toggleTopicAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = z.object({ id: idSchema, active: z.enum(['true', 'false']) }).safeParse({
    id: formData.get('id'),
    active: formData.get('active'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Choose a valid topic state.' };

  try {
    setTopicActive(parsed.data.id, parsed.data.active === 'true');
    revalidatePath('/admin');
    revalidatePath('/tickets/new');
    return { kind: 'success', message: 'Topic availability updated.' };
  } catch (error) {
    return reportFailure(error, 'The topic state could not be updated. Please try again.');
  }
}

export async function assignMemberAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = z.object({ userId: idSchema, teamId: idSchema }).safeParse({
    userId: formData.get('userId'),
    teamId: formData.get('teamId'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Choose a staff account and team.' };

  try {
    assignMemberToTeam(parsed.data.userId, parsed.data.teamId);
    revalidatePath('/admin');
    revalidatePath('/pending');
    revalidatePath('/tickets');
    return { kind: 'success', message: 'Team access is now active for this staff member.' };
  } catch (error) {
    return reportFailure(error, 'The staff member could not be added to that team. Please try again.');
  }
}
