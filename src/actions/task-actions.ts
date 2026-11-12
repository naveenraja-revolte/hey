'use server';

import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/auth-session';
import { DomainError, runAction, type ActionResult } from '@/lib/action-result';
import {
  taskDeleteSchema,
  taskInputSchema,
  taskMoveSchema,
  taskPageSchema,
  taskUpdateSchema,
} from '@/lib/validation';
import {
  createTaskForUser,
  deleteTaskForUser,
  getTaskPageForUser,
  moveTaskForUser,
  updateTaskForUser,
} from '@/services/task-service';

export async function createTaskAction(input: unknown) {
  return runAction('Create task', async () => {
    const userId = await requireUserId();
    const valid = taskInputSchema.parse(input);
    const task = await createTaskForUser(userId, valid);
    revalidatePath(`/boards/${valid.boardId}`);
    return task;
  });
}

export async function updateTaskAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Update task', async () => {
    const userId = await requireUserId();
    const valid = taskUpdateSchema.parse(input);
    const updated = await updateTaskForUser(userId, valid);
    if (!updated) throw new DomainError('That task is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function moveTaskAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Move task', async () => {
    const userId = await requireUserId();
    const valid = taskMoveSchema.parse(input);
    const moved = await moveTaskForUser(userId, valid.boardId, valid.taskId, valid.targetColumnId);
    if (!moved) throw new DomainError('That task is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function deleteTaskAction(input: unknown): Promise<ActionResult<void>> {
  return runAction('Delete task', async () => {
    const userId = await requireUserId();
    const valid = taskDeleteSchema.parse(input);
    const deleted = await deleteTaskForUser(userId, valid.boardId, valid.taskId);
    if (!deleted) throw new DomainError('That task is not available.');
    revalidatePath(`/boards/${valid.boardId}`);
  });
}

export async function loadMoreTasksAction(input: unknown) {
  return runAction('Load more tasks', async () => {
    const userId = await requireUserId();
    const valid = taskPageSchema.parse(input);
    const result = await getTaskPageForUser(userId, valid.boardId, valid.offset);
    if (!result) throw new DomainError('That board is not available.');
    return result;
  });
}
