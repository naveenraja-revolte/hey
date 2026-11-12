import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db, type DatabaseInstance } from '@/db';
import { boards, columns, tasks } from '@/db/schema';
import { DomainError } from '@/lib/action-result';

const MAX_COLUMNS = 20;

async function getOwnedColumn(
  userId: string,
  boardId: string,
  columnId: string,
  database: DatabaseInstance
) {
  const [record] = await database
    .select({ column: columns })
    .from(columns)
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId), eq(boards.userId, userId)))
    .limit(1);

  return record?.column ?? null;
}

export async function createColumnForUser(
  userId: string,
  boardId: string,
  title: string,
  database: DatabaseInstance = db
) {
  const [board] = await database
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .limit(1);

  if (!board) throw new DomainError('That board is not available.');

  const existing = await database
    .select({ id: columns.id })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .limit(MAX_COLUMNS);

  if (existing.length >= MAX_COLUMNS) {
    throw new DomainError(`A board can have up to ${MAX_COLUMNS} columns.`);
  }

  const [lastColumn] = await database
    .select({ position: columns.position })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(desc(columns.position))
    .limit(1);

  const [created] = await database
    .insert(columns)
    .values({
      boardId,
      title,
      position: lastColumn ? lastColumn.position + 1 : 0,
    })
    .returning();

  if (!created) throw new DomainError('The column could not be added. Try again.');
  return created;
}

export async function renameColumnForUser(
  userId: string,
  boardId: string,
  columnId: string,
  title: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  const column = await getOwnedColumn(userId, boardId, columnId, database);
  if (!column) return false;

  await database
    .update(columns)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)));

  return true;
}

export async function moveColumnForUser(
  userId: string,
  boardId: string,
  columnId: string,
  direction: 'left' | 'right',
  database: DatabaseInstance = db
): Promise<boolean> {
  const movingColumn = await getOwnedColumn(userId, boardId, columnId, database);
  if (!movingColumn) return false;

  const orderedColumns = await database
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position))
    .limit(MAX_COLUMNS);

  const currentIndex = orderedColumns.findIndex((column) => column.id === columnId);
  const neighbourIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
  const neighbour = orderedColumns[neighbourIndex];

  if (currentIndex < 0 || !neighbour) return true;

  await database.transaction((transaction) => {
    transaction
      .update(columns)
      .set({ position: neighbour.position, updatedAt: new Date() })
      .where(and(eq(columns.id, movingColumn.id), eq(columns.boardId, boardId)))
      .run();
    transaction
      .update(columns)
      .set({ position: movingColumn.position, updatedAt: new Date() })
      .where(and(eq(columns.id, neighbour.id), eq(columns.boardId, boardId)))
      .run();
  });

  return true;
}

export async function deleteColumnForUser(
  userId: string,
  boardId: string,
  columnId: string,
  database: DatabaseInstance = db
): Promise<boolean> {
  const column = await getOwnedColumn(userId, boardId, columnId, database);
  if (!column) return false;

  const [columnTotal] = await database
    .select({ total: count() })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .limit(1);

  if ((columnTotal?.total ?? 0) <= 1) {
    throw new DomainError('Keep at least one column on your board.');
  }

  const [taskTotal] = await database
    .select({ total: count() })
    .from(tasks)
    .where(and(eq(tasks.columnId, columnId), eq(tasks.boardId, boardId)))
    .limit(1);

  if ((taskTotal?.total ?? 0) > 0) {
    throw new DomainError('Move the tasks out of this column before removing it.');
  }

  await database.delete(columns).where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)));
  return true;
}
