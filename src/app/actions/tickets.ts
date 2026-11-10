'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentViewer } from '@/lib/viewer';
import {
  createTicket,
  InvalidTopicError,
  NoEligibleAssigneeError,
  reassignTicket,
  TicketNotAvailableError,
  updateTicketStatus,
} from '@/services/ticket.service';

export type ActionState = {
  kind: 'success' | 'error';
  message: string;
  ticketId?: string;
} | null;

const ticketSchema = z.object({
  subject: z.string().trim().min(4, 'Enter a subject with at least 4 characters.').max(120),
  description: z
    .string()
    .trim()
    .min(10, 'Add a little more detail (at least 10 characters).')
    .max(5000, 'Keep the description under 5,000 characters.'),
  topicId: z.string().uuid('Choose a topic.'),
});

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['new', 'in_progress', 'resolved']),
});

const reassignmentSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeId: z.string().min(1),
});

export async function createTicketAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getCurrentViewer();

  if (!viewer || viewer.role === 'pending') {
    return { kind: 'error', message: 'Sign in with an active team account to submit a ticket.' };
  }

  const parsed = ticketSchema.safeParse({
    subject: formData.get('subject'),
    description: formData.get('description'),
    topicId: formData.get('topicId'),
  });

  if (!parsed.success) {
    return { kind: 'error', message: parsed.error.issues[0]?.message ?? 'Check the ticket details.' };
  }

  try {
    const created = createTicket({ ...parsed.data, createdBy: viewer.id });
    revalidatePath('/tickets');

    return {
      kind: 'success',
      message: `Ticket assigned to ${created.assigneeName}.`,
      ticketId: created.id,
    };
  } catch (error) {
    if (error instanceof NoEligibleAssigneeError || error instanceof InvalidTopicError) {
      return { kind: 'error', message: error.message };
    }

    console.error('Ticket creation failed:', error);
    return { kind: 'error', message: 'The ticket could not be saved. Please try again.' };
  }
}

export async function updateTicketStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getCurrentViewer();

  if (!viewer || viewer.role !== 'member') {
    return { kind: 'error', message: 'Only an active assigned teammate can update this ticket.' };
  }

  const parsed = statusSchema.safeParse({
    ticketId: formData.get('ticketId'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    return { kind: 'error', message: 'Choose a valid ticket status.' };
  }

  try {
    updateTicketStatus(parsed.data.ticketId, parsed.data.status, viewer);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${parsed.data.ticketId}`);
    return { kind: 'success', message: 'Ticket status updated.' };
  } catch (error) {
    if (error instanceof TicketNotAvailableError) {
      return { kind: 'error', message: error.message };
    }

    console.error('Ticket status update failed:', error);
    return { kind: 'error', message: 'The status could not be updated. Please try again.' };
  }
}

export async function reassignTicketAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getCurrentViewer();

  if (!viewer || viewer.role !== 'admin') {
    return { kind: 'error', message: 'Administrator access is required to reassign tickets.' };
  }

  const parsed = reassignmentSchema.safeParse({
    ticketId: formData.get('ticketId'),
    assigneeId: formData.get('assigneeId'),
  });

  if (!parsed.success) {
    return { kind: 'error', message: 'Choose an active teammate.' };
  }

  try {
    reassignTicket(parsed.data.ticketId, parsed.data.assigneeId, viewer);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${parsed.data.ticketId}`);
    return { kind: 'success', message: 'Ticket reassigned.' };
  } catch (error) {
    if (error instanceof TicketNotAvailableError) {
      return { kind: 'error', message: error.message };
    }

    console.error('Ticket reassignment failed:', error);
    return { kind: 'error', message: 'The ticket could not be reassigned. Please try again.' };
  }
}
