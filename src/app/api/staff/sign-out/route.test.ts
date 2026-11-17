import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDatabase } from "@/db/database";
import { staffUsers } from "@/db/schema";
import {
  createStaffSession,
  getStaffForSession,
  staffSessionCookie,
} from "@/lib/auth-service";
import { handleStaffSignOut } from "@/app/api/staff/sign-out/route";

const authSecret = "test-secret-that-is-at-least-32-characters-long";

describe("staff sign-out route", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = authSecret;
  });

  it("revokes the persistent session and clears the cookie", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      db.insert(staffUsers)
        .values({
          id: "staff-1",
          email: "staff@example.com",
          passwordHash: "not-used-in-this-test",
          createdAt: new Date().toISOString(),
        })
        .run();
      const session = createStaffSession(db, "staff-1");
      const request = new NextRequest("http://localhost/api/staff/sign-out", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          cookie: `${staffSessionCookie}=${session.token}`,
        },
      });

      const response = await handleStaffSignOut(request, db);
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
      expect(getStaffForSession(db, session.token)).toBeNull();
    } finally {
      client.close();
    }
  });
});
