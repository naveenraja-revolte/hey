import { and, asc, count, eq } from 'drizzle-orm';
import { db, type DatabaseInstance } from '@/db';
import { boards, columns, tasks } from '@/db/schema';
import { DomainError } from '@/lib/action-result';

async function ownsBoard(userId: string, boardId: string, database: DatabaseInstance) {
  const [board] = await database
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .limit(1);

  return Boolean(board);
}

async function belongsToBoard(columnId: string, boardId: string, database: DatabaseInstance) {
  const [column] = await database
    .select({ id: columns.id })
    .from(columns)
    .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)))
    .limit(1);

  return Boolean(column);
}

async function nextTaskPosition(columnId: string, database: DatabaseInstance) {
  const [result] = await database
    .select({ total: count() })
    .from(tasks)
    .where(eq(tasks.columnId, columnId))
    .limit(1);

  return result?.total ?? 0;
}

export async function createTaskForUser(
  userId: string,
  input: {
    boardId: string;
    columnId: string;
    title: string;
    description: string;
    priority: 'low' | 'normal' | 'high';
    dueDate: string | null;
  },
  database: DatabaseInstance = db
) {
  if (!(await ownsBoard(userId, input.boardId, database))) {
    throw new DomainError('That board is not available.');
  }
  if (!(await belongsToBoard(input.columnId, input.boardId, database))) {
    throw new DomainError('Choose a column on this board.');
  }

  const [created] = await database
    .insert(tasks)
    .values({
      ...input,
      assigneeId: userId,
      position: await nextTaskPosition(input.columnId, database),
    })
    .returning();

  if (!created) throw new DomainError('The task could not be created. Try again.');
  return created;
}

export async function updateTaskForUser(
  userId: string,
  input: {
    boardId: string;
    columnId: string;
    taskId: string;
    title: string;
    description: string;
    priority: 'low' | 'normal' | 'high';
    dueDate: string | null;
  },
  database: DatabaseInstance = db
): Promise<boolean> {
  if (!(await ownsBoard(userId, input.boardId, database))) return false;
  if (!(await belongsToBoard(input.columnId, input.boardId, database))) {
    throw new DomainError('Choose a column on this board.');
  }

  const updated = await database
    .update(tasks)
    .set({
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, input.taskId), eq(tasks.boardId, input.boardId)))
    .returning({ id: tasks.id });

  return updated.length > 0;
}

export async function moveTaskForUser(
  userId: string,
  boardId: string,
  taskId: string,
  targetColumnId: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  if (!(await ownsBoard(userId, boardId, database))) return false;
  if (!(await belongsToBoard(targetColumnId, boardId, database))) {
    throw new DomainError('Choose a column on this board.');
  }

  const updated = await database
    .update(tasks)
    .set({
      columnId: targetColumnId,
      position: await nextTaskPosition(targetColumnId, database),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.boardId, boardId)))
    .returning({ id: tasks.id });

  return updated.length > 0;
}

export async function deleteTaskForUser(
  userId: string,
  boardId: string,
  taskId: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  if (!(await ownsBoard(userId, boardId, database))) return false;

  const deleted = await database
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.boardId, boardId)))
    .returning({ id: tasks.id });

  return deleted.length > 0;
}

export async function getTaskPageForUser(
  userId: string,
  boardId: string,
  offset: number,
  database: DatabaseInstance = db
) {
  if (!(await ownsBoard(userId, boardId, database))) return null;

  const rows = await database
    .select()
    .from(tasks)
    .where(eq(tasks.boardId, boardId))
    .orderBy(asc(tasks.createdAt), asc(tasks.id))
    .limit(51)
    .offset(offset);

  return {
    tasks: rows.slice(0, 50),
    hasMoreTasks: rows.length > 50,
  };
}
