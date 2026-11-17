import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/database";
import { staffUsers } from "@/db/schema";
import {
  createStaffSession,
  getStaffForSession,
  hashClientAddress,
  isLoginAddressBlocked,
  passwordHash,
  recordFailedLogin,
  revokeStaffSession,
  staffSessionDurationMs,
} from "@/lib/auth-service";

const authSecret = "test-secret-that-is-at-least-32-characters-long";

describe("staff session and login security", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = authSecret;
  });

  it("stores only a session hash, expires sessions, and revokes on sign-out", () => {
    const { client, db } = createDatabase(":memory:");
    try {
      db.insert(staffUsers)
        .values({
          id: "staff-1",
          email: "staff@example.com",
          passwordHash: passwordHash("a long password"),
          createdAt: new Date().toISOString(),
        })
        .run();
      const now = 1_800_000_000_000;
      const session = createStaffSession(db, "staff-1", now);
      expect(getStaffForSession(db, session.token, now)).toEqual({
        id: "staff-1",
        email: "staff@example.com",
      });
      expect(
        getStaffForSession(db, session.token, now + staffSessionDurationMs + 1),
      ).toBeNull();
      revokeStaffSession(db, session.token);
      expect(getStaffForSession(db, session.token, now)).toBeNull();
    } finally {
      client.close();
    }
  });

  it("throttles repeated failures by a hashed client address", () => {
    const { client, db } = createDatabase(":memory:");
    try {
      const key = hashClientAddress("192.0.2.25");
      const now = 1_800_000_000_000;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        recordFailedLogin(db, key, now);
      }
      expect(isLoginAddressBlocked(db, key, now)).toBe(false);
      recordFailedLogin(db, key, now);
      expect(isLoginAddressBlocked(db, key, now)).toBe(true);
      expect(isLoginAddressBlocked(db, key, now + 15 * 60 * 1000 + 1)).toBe(
        false,
      );
    } finally {
      client.close();
    }
  });
});
