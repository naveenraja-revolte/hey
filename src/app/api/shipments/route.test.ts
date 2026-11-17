import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDatabase } from "@/db/database";
import { shipments } from "@/db/schema";
import { getShipmentByTrackingNumber } from "@/lib/shipment-service";
import { createShipmentRequest } from "@/app/api/shipments/route";

const shipmentPayload = {
  senderName: "Morgan Lee",
  senderEmail: "morgan@example.com",
  senderAddress: "18 River Street, Portland, OR",
  recipientName: "Avery Chen",
  recipientAddress: "42 Pine Avenue, Salem, OR",
  parcelDescription: "Books and stationery",
};

function request(body: string, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/shipments", {
    method: "POST",
    headers: { "content-type": "application/json", origin, host: "localhost" },
    body,
  });
}

describe("shipment booking route", () => {
  it("rejects malformed, invalid, and cross-origin requests", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      expect((await createShipmentRequest(request("{"), db)).status).toBe(400);
      expect(
        (
          await createShipmentRequest(
            request(
              JSON.stringify({ ...shipmentPayload, senderEmail: "invalid" }),
            ),
            db,
          )
        ).status,
      ).toBe(422);
      expect(
        (
          await createShipmentRequest(
            request(
              JSON.stringify(shipmentPayload),
              "https://attacker.example",
            ),
            db,
          )
        ).status,
      ).toBe(403);
      expect(db.select().from(shipments).all()).toHaveLength(0);
    } finally {
      client.close();
    }
  });

  it("creates a shipment that can be retrieved by its tracking number", async () => {
    const { client, db } = createDatabase(":memory:");
    try {
      const response = await createShipmentRequest(
        request(JSON.stringify(shipmentPayload)),
        db,
      );
      const result = (await response.json()) as { trackingNumber: string };
      expect(response.status).toBe(201);
      expect(result.trackingNumber).toMatch(/^PD-[A-F0-9]{20}$/);
      expect(
        getShipmentByTrackingNumber(db, result.trackingNumber)?.recipientName,
      ).toBe("Avery Chen");
    } finally {
      client.close();
    }
  });
});
