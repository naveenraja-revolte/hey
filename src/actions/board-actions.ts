'use server';

import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/auth-session';
import { DomainError, runAction, type ActionResult } from '@/lib/action-result';
import { boardIdSchema, boardInputSchema, boardUpdateSchema } from '@/lib/validation';
import {
  createBoardForUser,
  deleteBoardForUser,
  updateBoardForUser,
} from '@/services/board-service';

export async function createBoardAction(input: unknown) {
  return runAction('Create board', async () => {
    const userId = await requireUserId();
    const valid = boardInputSchema.parse(input);
    const board = await createBoardForUser(userId, valid.title);
    revalidatePath('/boards');
    return { boardId: board.id };
  });
}

export async function updateBoardAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Update board', async () => {
    const userId = await requireUserId();
    const valid = boardUpdateSchema.parse(input);
    const updated = await updateBoardForUser(userId, valid.boardId, valid.title);
    if (!updated) throw new DomainError('That board is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function deleteBoardAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Delete board', async () => {
    const userId = await requireUserId();
    const valid = boardIdSchema.parse(input);
    const deleted = await deleteBoardForUser(userId, valid.boardId);
    if (!deleted) throw new DomainError('That board is not available.');
    revalidatePath('/boards');
  });
}
