import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import type { AppDatabase } from "@/db/database";
import { loginAttempts, staffSessions, staffUsers } from "@/db/schema";

export const staffSessionCookie = "parcel_delivery_session";
export const staffSessionDurationMs = 8 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;
const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 10);

export type StaffIdentity = { id: string; email: string };

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be configured with at least 32 characters.",
    );
  }
  return secret;
}

function hashToken(token: string): string {
  return createHmac("sha256", getAuthSecret()).update(token).digest("hex");
}

export function hashClientAddress(address: string | null): string {
  return createHmac("sha256", getAuthSecret())
    .update(address?.trim() || "unknown")
    .digest("hex");
}

export async function verifyStaffPassword(
  db: AppDatabase,
  email: string,
  password: string,
): Promise<StaffIdentity | null> {
  const staff = db
    .select({
      id: staffUsers.id,
      email: staffUsers.email,
      passwordHash: staffUsers.passwordHash,
    })
    .from(staffUsers)
    .where(eq(staffUsers.email, email.toLowerCase()))
    .get();
  const passwordMatches = await bcrypt.compare(
    password,
    staff?.passwordHash ?? dummyPasswordHash,
  );
  if (!staff || !passwordMatches) return null;
  return { id: staff.id, email: staff.email };
}

export function createStaffSession(
  db: AppDatabase,
  staffUserId: string,
  now = Date.now(),
): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + staffSessionDurationMs;
  db.transaction((transaction) => {
    transaction
      .delete(staffSessions)
      .where(lt(staffSessions.expiresAt, now))
      .run();
    transaction
      .insert(staffSessions)
      .values({
        tokenHash: hashToken(token),
        staffUserId,
        createdAt: now,
        expiresAt,
      })
      .run();
  });
  return { token, expiresAt };
}

export function getStaffForSession(
  db: AppDatabase,
  token: string | undefined,
  now = Date.now(),
): StaffIdentity | null {
  if (!token) return null;
  const result = db
    .select({ id: staffUsers.id, email: staffUsers.email })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffSessions.staffUserId, staffUsers.id))
    .where(
      and(
        eq(staffSessions.tokenHash, hashToken(token)),
        gt(staffSessions.expiresAt, now),
      ),
    )
    .get();
  return result ?? null;
}

export function revokeStaffSession(
  db: AppDatabase,
  token: string | undefined,
): void {
  if (!token) return;
  db.delete(staffSessions)
    .where(eq(staffSessions.tokenHash, hashToken(token)))
    .run();
}

export function isLoginAddressBlocked(
  db: AppDatabase,
  addressHash: string,
  now = Date.now(),
): boolean {
  const record = db
    .select({ blockedUntil: loginAttempts.blockedUntil })
    .from(loginAttempts)
    .where(eq(loginAttempts.addressHash, addressHash))
    .get();
  return (
    record?.blockedUntil !== null &&
    record?.blockedUntil !== undefined &&
    record.blockedUntil > now
  );
}

export function recordFailedLogin(
  db: AppDatabase,
  addressHash: string,
  now = Date.now(),
): void {
  db.$client
    .prepare(
      `INSERT INTO login_attempts
        (address_hash, attempt_count, window_started_at, blocked_until)
       VALUES (@addressHash, 1, @now, NULL)
       ON CONFLICT(address_hash) DO UPDATE SET
         attempt_count = CASE
           WHEN window_started_at <= @windowStart THEN 1
           ELSE attempt_count + 1
         END,
         window_started_at = CASE
           WHEN window_started_at <= @windowStart THEN @now
           ELSE window_started_at
         END,
         blocked_until = CASE
           WHEN CASE
             WHEN window_started_at <= @windowStart THEN 1
             ELSE attempt_count + 1
           END >= @maximumAttempts THEN @blockedUntil
           ELSE NULL
         END`,
    )
    .run({
      addressHash,
      now,
      windowStart: now - loginWindowMs,
      maximumAttempts: maxLoginAttempts,
      blockedUntil: now + loginWindowMs,
    });
}

export function clearFailedLogins(db: AppDatabase, addressHash: string): void {
  db.delete(loginAttempts)
    .where(eq(loginAttempts.addressHash, addressHash))
    .run();
}

export function passwordHash(password: string): string {
  return bcrypt.hashSync(password, 12);
}
