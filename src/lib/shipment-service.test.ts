import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/database";
import { shipments, staffUsers } from "@/db/schema";
import {
  advanceShipment,
  createShipment,
  getShipmentByTrackingNumber,
  InvalidStatusTransitionError,
  listShipments,
} from "@/lib/shipment-service";
import { shipmentCreationSchema } from "@/lib/validation";

const validShipment = {
  senderName: "Morgan Lee",
  senderEmail: "morgan@example.com",
  senderAddress: "18 River Street, Portland, OR",
  recipientName: "Avery Chen",
  recipientAddress: "42 Pine Avenue, Salem, OR",
  parcelDescription: "Books and stationery",
};

const handles: ReturnType<typeof createDatabase>[] = [];
function database() {
  const handle = createDatabase(":memory:");
  handles.push(handle);
  return handle;
}

afterEach(() => {
  for (const handle of handles.splice(0)) handle.client.close();
});

describe("shipment services", () => {
  it("persists a shipment and its initial event for tracking", () => {
    const { db } = database();
    const created = createShipment(db, validShipment, {
      createTrackingNumber: () => "PD-TRACK000001",
      now: () => new Date("2026-01-02T12:00:00.000Z"),
    });
    const shipment = getShipmentByTrackingNumber(db, created.trackingNumber);

    expect(shipment?.status).toBe("booked");
    expect(shipment?.senderEmail).toBe("morgan@example.com");
    expect(shipment?.events).toHaveLength(1);
    expect(shipment?.events[0]?.message).toContain("registered");
    expect(getShipmentByTrackingNumber(db, "PD-UNKNOWN")).toBeNull();
  });

  it("retries a tracking-number collision while the database enforces uniqueness", () => {
    const { db } = database();
    createShipment(db, validShipment, {
      createTrackingNumber: () => "PD-DUPLICATE01",
    });
    const candidates = ["PD-DUPLICATE01", "PD-UNIQUE000001"];
    const created = createShipment(db, validShipment, {
      createTrackingNumber: () => candidates.shift() ?? "PD-FALLBACK0001",
    });

    expect(created.trackingNumber).toBe("PD-UNIQUE000001");
    expect(db.select().from(shipments).all()).toHaveLength(2);
  });

  it("rejects invalid booking data and invalid status transitions", () => {
    const { db } = database();
    const invalid = shipmentCreationSchema.safeParse({
      ...validShipment,
      senderEmail: "not-an-email",
    });
    expect(invalid.success).toBe(false);

    createShipment(db, validShipment, {
      createTrackingNumber: () => "PD-TRANSITION01",
    });
    expect(() =>
      advanceShipment(db, "PD-TRANSITION01", "in_transit", "staff-1"),
    ).toThrow(InvalidStatusTransitionError);
    expect(
      getShipmentByTrackingNumber(db, "PD-TRANSITION01")?.events,
    ).toHaveLength(1);
  });

  it("records an authorized status change with history atomically", () => {
    const { db } = database();
    db.insert(staffUsers)
      .values({
        id: "staff-1",
        email: "staff@example.com",
        passwordHash: "hash",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
      .run();
    createShipment(db, validShipment, {
      createTrackingNumber: () => "PD-HISTORY0001",
    });

    const updated = advanceShipment(
      db,
      "PD-HISTORY0001",
      "collected",
      "staff-1",
      "Picked up at sender address",
    );
    expect(updated?.status).toBe("collected");
    expect(updated?.events).toHaveLength(2);
    expect(updated?.events[1]?.message).toBe("Picked up at sender address");
  });

  it("filters and paginates the staff list", () => {
    const { db } = database();
    createShipment(db, validShipment, {
      createTrackingNumber: () => "PD-LIST0000001",
    });
    createShipment(
      db,
      { ...validShipment, recipientName: "Jordan Park" },
      { createTrackingNumber: () => "PD-LIST0000002" },
    );

    const filtered = listShipments(db, {
      search: "Jordan",
      status: "booked",
      page: 1,
    });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.recipientName).toBe("Jordan Park");
  });
});
