import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDatabase } from "@/db/database";
import { staffUsers } from "@/db/schema";
import { passwordHash } from "@/lib/auth-service";
import { handleStaffSignIn } from "@/app/api/staff/sign-in/route";

const authSecret = "test-secret-that-is-at-least-32-characters-long";

function request(body: unknown, ip = "192.0.2.10") {
  return new NextRequest("http://localhost/api/staff/sign-in", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("staff sign-in route", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = authSecret;
  });

  it("rejects invalid payloads and cross-origin requests", async () => {
    const { client, db } = createDatabase(":memory:");
    const invalid = await handleStaffSignIn(
      request({ email: "bad", password: "" }),
      db,
    );
    expect(invalid.status).toBe(422);

    const crossOrigin = new NextRequest("http://localhost/api/staff/sign-in", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
        host: "localhost",
      },
      body: JSON.stringify({
        email: "staff@example.com",
        password: "password",
      }),
    });
    expect((await handleStaffSignIn(crossOrigin, db)).status).toBe(403);
    client.close();
  });

  it("returns the same rejection for an incorrect password", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      db.insert(staffUsers)
        .values({
          id: "staff-1",
          email: "staff@example.com",
          passwordHash: passwordHash("correct horse battery staple"),
          createdAt: new Date().toISOString(),
        })
        .run();
      const response = await handleStaffSignIn(
        request({ email: "staff@example.com", password: "wrong password" }),
        db,
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Invalid email or password.",
      });
    } finally {
      client.close();
    }
  });

  it("creates a hashed persistent session for valid credentials", async () => {
    const { client, db } = createDatabase(":memory:");
    db.insert(staffUsers)
      .values({
        id: "staff-1",
        email: "staff@example.com",
        passwordHash: passwordHash("correct horse battery staple"),
        createdAt: new Date().toISOString(),
      })
      .run();

    const response = await handleStaffSignIn(
      request({
        email: "staff@example.com",
        password: "correct horse battery staple",
      }),
      db,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain(
      "samesite=strict",
    );
    const rows = db.$client
      .prepare("SELECT token_hash FROM staff_sessions")
      .all() as Array<{ token_hash: string }>;
    expect(rows).toHaveLength(1);
    expect(response.headers.get("set-cookie")).not.toContain(
      rows[0]?.token_hash,
    );
    client.close();
  });
});
