import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { after, test } from 'node:test';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import {
  createBoardForUser,
  deleteBoardForUser,
  getBoardForUser,
  updateBoardForUser,
} from '@/services/board-service';
import { deleteColumnForUser } from '@/services/column-service';
import { createTaskForUser } from '@/services/task-service';
import { taskInputSchema } from '@/lib/validation';

const sqlite = new Database(':memory:');
sqlite.pragma('foreign_keys = ON');
sqlite.exec(`
  CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE board_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'normal',
    due_date TEXT,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const database = drizzle(sqlite, { schema });
const now = Date.now();
const addUser = sqlite.prepare(
  'INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
);
addUser.run('owner', 'Ada', 'ada@example.test', now, now);
addUser.run('intruder', 'Sam', 'sam@example.test', now, now);

after(() => sqlite.close());

test('a person cannot read, rename, or delete another account’s board', async () => {
  const board = await createBoardForUser('owner', 'Private project', database);

  assert.equal(await getBoardForUser('intruder', board.id, database), null);
  assert.equal(
    await updateBoardForUser('intruder', board.id, 'Changed by another user', database),
    false
  );
  assert.equal(await deleteBoardForUser('intruder', board.id, database), false);

  const ownerView = await getBoardForUser('owner', board.id, database);
  assert.equal(ownerView?.title, 'Private project');
  assert.deepEqual(
    ownerView?.columns.map((column) => column.title),
    ['To Do', 'In Progress', 'Done']
  );
});

test('task validation rejects blank titles and impossible dates', () => {
  const base = {
    boardId: 'board-id',
    columnId: 'column-id',
    description: '',
    priority: 'normal',
  };

  assert.equal(taskInputSchema.safeParse({ ...base, title: '   ', dueDate: '' }).success, false);
  assert.equal(
    taskInputSchema.safeParse({ ...base, title: 'Write plan', dueDate: '2026-02-30' }).success,
    false
  );
  assert.equal(
    taskInputSchema.safeParse({ ...base, title: 'Write plan', dueDate: '' }).success,
    true
  );
});

test('tasks stay with their owner and populated columns cannot be removed', async () => {
  const board = await createBoardForUser('owner', 'Planning', database);
  const [column] = await database
    .select()
    .from(schema.columns)
    .where(eq(schema.columns.boardId, board.id))
    .limit(1);

  assert.ok(column);
  await assert.rejects(
    () =>
      createTaskForUser(
        'intruder',
        {
          boardId: board.id,
          columnId: column.id,
          title: 'Unauthorized task',
          description: '',
          priority: 'normal',
          dueDate: null,
        },
        database
      ),
    /not available/
  );

  await createTaskForUser(
    'owner',
    {
      boardId: board.id,
      columnId: column.id,
      title: 'Prepare the outline',
      description: '',
      priority: 'high',
      dueDate: null,
    },
    database
  );

  await assert.rejects(
    () => deleteColumnForUser('owner', board.id, column.id, database),
    /Move the tasks out/
  );
});
