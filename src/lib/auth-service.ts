import { randomBytes, randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt, lte } from 'drizzle-orm';
import { db, type AppDatabase } from '@/db';
import { sessions, users, workspaces } from '@/db/schema';

const sessionDurationDays = 30;
const dummyPasswordHash = bcrypt.hashSync('not-a-real-password', 12);

export type Account = {
  id: string;
  name: string;
  email: string;
};

export async function registerAccount(
  input: { name: string; email: string; password: string },
  database: AppDatabase = db,
): Promise<Account> {
  const now = new Date().toISOString();
  const account = {
    id: randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: now,
  };
  const workspaceId = randomUUID();

  database.transaction((transaction) => {
    transaction.insert(users).values(account).run();
    transaction
      .insert(workspaces)
      .values({ id: workspaceId, ownerId: account.id, name: 'My Workspace', createdAt: now })
      .run();
  });

  return { id: account.id, name: account.name, email: account.email };
}

export async function authenticateAccount(
  email: string,
  password: string,
  database: AppDatabase = db,
): Promise<Account | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const account = database.select().from(users).where(eq(users.email, normalizedEmail)).get();
  const passwordMatches = await bcrypt.compare(password, account?.passwordHash ?? dummyPasswordHash);

  if (!account || !passwordMatches) return null;
  return { id: account.id, name: account.name, email: account.email };
}

export function createSession(
  userId: string,
  database: AppDatabase = db,
  now = new Date(),
): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + sessionDurationDays * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const tokenHash = hashSessionToken(token);

  database.transaction((transaction) => {
    transaction.delete(sessions).where(lte(sessions.expiresAt, nowIso)).run();
    transaction.insert(sessions).values({ tokenHash, userId, expiresAt }).run();
  });

  return { token, expiresAt };
}

export function getAccountForSession(
  token: string,
  database: AppDatabase = db,
  now = new Date(),
): Account | null {
  const session = database
    .select({ account: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, now.toISOString())))
    .get();

  return session?.account ?? null;
}

export function revokeSession(token: string, database: AppDatabase = db): void {
  database.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token))).run();
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
