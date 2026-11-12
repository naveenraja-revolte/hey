import { and, count, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, type AppDatabase } from '@/db';
import { clients, leads, projects, workspaces } from '@/db/schema';

export function listWorkspaces(ownerId: string, database: AppDatabase = db) {
  return database
    .select({ id: workspaces.id, name: workspaces.name, createdAt: workspaces.createdAt })
    .from(workspaces)
    .where(eq(workspaces.ownerId, ownerId))
    .orderBy(workspaces.createdAt)
    .limit(100)
    .all();
}

export function getOwnedWorkspace(ownerId: string, workspaceId: string, database: AppDatabase = db) {
  return database
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)))
    .get();
}

export function createWorkspace(ownerId: string, name: string, database: AppDatabase = db): string {
  const id = randomUUID();
  database
    .insert(workspaces)
    .values({ id, ownerId, name, createdAt: new Date().toISOString() })
    .run();
  return id;
}

export function renameWorkspace(
  ownerId: string,
  workspaceId: string,
  name: string,
  database: AppDatabase = db,
): boolean {
  return (
    database
      .update(workspaces)
      .set({ name })
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)))
      .run().changes > 0
  );
}

export function deleteWorkspaceIfEmpty(
  ownerId: string,
  workspaceId: string,
  database: AppDatabase = db,
): 'deleted' | 'not-found' | 'contains-records' {
  return database.transaction((transaction) => {
    const workspace = transaction
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)))
      .get();
    if (!workspace) return 'not-found';

    const recordCounts = [
      transaction.select({ value: count() }).from(clients).where(eq(clients.workspaceId, workspaceId)).get()?.value ?? 0,
      transaction.select({ value: count() }).from(leads).where(eq(leads.workspaceId, workspaceId)).get()?.value ?? 0,
      transaction.select({ value: count() }).from(projects).where(eq(projects.workspaceId, workspaceId)).get()?.value ?? 0,
    ];
    if (recordCounts.some((value) => value > 0)) return 'contains-records';

    transaction.delete(workspaces).where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId))).run();
    return 'deleted';
  });
}
