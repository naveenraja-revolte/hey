'use server';

import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/auth-session';
import { DomainError, runAction, type ActionResult } from '@/lib/action-result';
import { columnIdSchema, columnInputSchema, columnMoveSchema } from '@/lib/validation';
import {
  createColumnForUser,
  deleteColumnForUser,
  moveColumnForUser,
  renameColumnForUser,
} from '@/services/column-service';

export async function createColumnAction(input: unknown) {
  return runAction('Create column', async () => {
    const userId = await requireUserId();
    const valid = columnInputSchema.parse(input);
    const column = await createColumnForUser(userId, valid.boardId, valid.title);
    revalidatePath(`/boards/${valid.boardId}`);
    return column;
  });
}

export async function renameColumnAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Rename column', async () => {
    const userId = await requireUserId();
    const valid = columnInputSchema
      .extend({ columnId: columnIdSchema.shape.columnId })
      .parse(input);
    const updated = await renameColumnForUser(userId, valid.boardId, valid.columnId, valid.title);
    if (!updated) throw new DomainError('That column is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function moveColumnAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Move column', async () => {
    const userId = await requireUserId();
    const valid = columnMoveSchema.parse(input);
    const updated = await moveColumnForUser(userId, valid.boardId, valid.columnId, valid.direction);
    if (!updated) throw new DomainError('That column is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function deleteColumnAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Delete column', async () => {
    const userId = await requireUserId();
    const valid = columnIdSchema.parse(input);
    const deleted = await deleteColumnForUser(userId, valid.boardId, valid.columnId);
    if (!deleted) throw new DomainError('That column is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}
