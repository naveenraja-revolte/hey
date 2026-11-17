import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDatabase } from "@/db/database";
import { shipmentEvents, staffUsers } from "@/db/schema";
import {
  createStaffSession,
  passwordHash,
  staffSessionCookie,
} from "@/lib/auth-service";
import { createShipment } from "@/lib/shipment-service";
import { updateShipmentStatus } from "@/app/api/staff/shipments/[trackingNumber]/route";

const authSecret = "test-secret-that-is-at-least-32-characters-long";
const trackingNumber = "PD-PROTECTED00001";
const payload = {
  senderName: "Morgan Lee",
  senderEmail: "morgan@example.com",
  senderAddress: "18 River Street, Portland, OR",
  recipientName: "Avery Chen",
  recipientAddress: "42 Pine Avenue, Salem, OR",
  parcelDescription: "Books and stationery",
};

function request(body: unknown, token?: string) {
  const headers = new Headers({
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  });
  if (token) headers.set("cookie", `${staffSessionCookie}=${token}`);
  return new NextRequest(
    `http://localhost/api/staff/shipments/${trackingNumber}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    },
  );
}

describe("shipment status route", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = authSecret;
  });

  it("denies unauthenticated status changes", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      const response = await updateShipmentStatus(
        request({ status: "collected" }),
        { params: Promise.resolve({ trackingNumber }) },
        db,
      );
      expect(response.status).toBe(401);
    } finally {
      client.close();
    }
  });

  it("records valid updates and rejects invalid transitions without changing history", async () => {
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
      createShipment(db, payload, {
        createTrackingNumber: () => trackingNumber,
      });
      const session = createStaffSession(db, "staff-1");

      const invalid = await updateShipmentStatus(
        request({ status: "in_transit" }, session.token),
        { params: Promise.resolve({ trackingNumber }) },
        db,
      );
      expect(invalid.status).toBe(409);
      expect(db.select().from(shipmentEvents).all()).toHaveLength(1);

      const updated = await updateShipmentStatus(
        request(
          { status: "collected", note: "Collected from sender" },
          session.token,
        ),
        { params: Promise.resolve({ trackingNumber }) },
        db,
      );
      expect(updated.status).toBe(200);
      expect(db.select().from(shipmentEvents).all()).toHaveLength(2);
    } finally {
      client.close();
    }
  });

  it("rejects cross-origin requests even with a valid session", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      db.insert(staffUsers)
        .values({
          id: "staff-1",
          email: "staff@example.com",
          passwordHash: "hash",
          createdAt: new Date().toISOString(),
        })
        .run();
      const session = createStaffSession(db, "staff-1");
      const crossOrigin = new NextRequest(
        `http://localhost/api/staff/shipments/${trackingNumber}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "https://attacker.example",
            host: "localhost",
            cookie: `${staffSessionCookie}=${session.token}`,
          },
          body: JSON.stringify({ status: "collected" }),
        },
      );
      const response = await updateShipmentStatus(
        crossOrigin,
        { params: Promise.resolve({ trackingNumber }) },
        db,
      );
      expect(response.status).toBe(403);
    } finally {
      client.close();
    }
  });
});
