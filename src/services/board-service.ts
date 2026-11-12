import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db, type DatabaseInstance } from '@/db';
import { boards, columns, tasks, type Board } from '@/db/schema';
import { DomainError } from '@/lib/action-result';

const startingColumns = ['To Do', 'In Progress', 'Done'] as const;
const TASK_PAGE_SIZE = 50;

export interface BoardSummary extends Board {
  columnCount: number;
}

export interface BoardPageData extends Board {
  columns: Array<typeof columns.$inferSelect & { taskCount: number }>;
  tasks: Array<typeof tasks.$inferSelect>;
  hasMoreTasks: boolean;
}

export async function listBoardsForUser(
  userId: string,
  database: DatabaseInstance = db
): Promise<BoardSummary[]> {
  const records = await database
    .select({ board: boards, columnCount: count(columns.id) })
    .from(boards)
    .leftJoin(columns, eq(columns.boardId, boards.id))
    .where(eq(boards.userId, userId))
    .groupBy(boards.id)
    .orderBy(desc(boards.updatedAt))
    .limit(100);

  return records.map(({ board, columnCount }) => ({ ...board, columnCount }));
}

export async function createBoardForUser(
  userId: string,
  title: string,
  database: DatabaseInstance = db
): Promise<Board> {
  return database.transaction((transaction) => {
    const [board] = transaction.insert(boards).values({ userId, title }).returning().all();

    if (!board) {
      throw new DomainError('The board could not be created. Try again.');
    }

    transaction
      .insert(columns)
      .values(
        startingColumns.map((columnTitle, position) => ({
          boardId: board.id,
          title: columnTitle,
          position,
        }))
      )
      .run();

    return board;
  });
}

export async function getBoardForUser(
  userId: string,
  boardId: string,
  database: DatabaseInstance = db
): Promise<BoardPageData | null> {
  const [board] = await database
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .limit(1);

  if (!board) return null;

  const [boardColumns, taskRows, counts] = await Promise.all([
    database
      .select()
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position))
      .limit(20),
    database
      .select()
      .from(tasks)
      .where(eq(tasks.boardId, boardId))
      .orderBy(asc(tasks.createdAt), asc(tasks.id))
      .limit(TASK_PAGE_SIZE + 1),
    database
      .select({ columnId: tasks.columnId, total: count() })
      .from(tasks)
      .where(eq(tasks.boardId, boardId))
      .groupBy(tasks.columnId)
      .limit(20),
  ]);

  const taskCounts = new Map(counts.map(({ columnId, total }) => [columnId, total]));
  const hasMoreTasks = taskRows.length > TASK_PAGE_SIZE;

  return {
    ...board,
    columns: boardColumns.map((column) => ({
      ...column,
      taskCount: taskCounts.get(column.id) ?? 0,
    })),
    tasks: taskRows.slice(0, TASK_PAGE_SIZE),
    hasMoreTasks,
  };
}

export async function updateBoardForUser(
  userId: string,
  boardId: string,
  title: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  const updated = await database
    .update(boards)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .returning({ id: boards.id });

  return updated.length > 0;
}

export async function deleteBoardForUser(
  userId: string,
  boardId: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  const deleted = await database
    .delete(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .returning({ id: boards.id });

  return deleted.length > 0;
}
