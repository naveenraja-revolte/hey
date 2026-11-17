import { randomBytes, randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import type { AppDatabase } from "@/db/database";
import { shipmentEvents, shipments } from "@/db/schema";
import {
  canAdvanceShipment,
  shipmentStatusLabels,
  type ShipmentStatus,
} from "@/lib/shipment-status";
import type { ShipmentCreationInput } from "@/lib/validation";

export const shipmentPageSize = 20;

type ShipmentCreationOptions = {
  now?: () => Date;
  createTrackingNumber?: () => string;
};

export class InvalidStatusTransitionError extends Error {
  constructor(currentStatus: ShipmentStatus, nextStatus: ShipmentStatus) {
    super(`Cannot move a shipment from ${currentStatus} to ${nextStatus}.`);
    this.name = "InvalidStatusTransitionError";
  }
}

function isTrackingNumberConflict(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      "UNIQUE constraint failed: shipments.tracking_number",
    )
  );
}

function generateTrackingNumber(): string {
  return `PD-${randomBytes(10).toString("hex").toUpperCase()}`;
}

export function createShipment(
  db: AppDatabase,
  input: ShipmentCreationInput,
  options: ShipmentCreationOptions = {},
): { id: string; trackingNumber: string } {
  const now = options.now ?? (() => new Date());
  const trackingNumberFactory =
    options.createTrackingNumber ?? generateTrackingNumber;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const trackingNumber = trackingNumberFactory();
    const timestamp = now().toISOString();
    const id = randomUUID();

    try {
      db.transaction((transaction) => {
        transaction
          .insert(shipments)
          .values({
            id,
            trackingNumber,
            senderName: input.senderName,
            senderEmail: input.senderEmail.toLowerCase(),
            senderPhone: input.senderPhone ?? null,
            senderAddress: input.senderAddress,
            recipientName: input.recipientName,
            recipientPhone: input.recipientPhone ?? null,
            recipientAddress: input.recipientAddress,
            parcelDescription: input.parcelDescription,
            status: "booked",
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          .run();
        transaction
          .insert(shipmentEvents)
          .values({
            id: randomUUID(),
            shipmentId: id,
            status: "booked",
            message: "Shipment registered and ready for collection.",
            staffUserId: null,
            occurredAt: timestamp,
          })
          .run();
      });
      return { id, trackingNumber };
    } catch (error) {
      if (isTrackingNumberConflict(error) && attempt < 2) continue;
      throw error;
    }
  }

  throw new Error("A unique tracking number could not be created.");
}

export function getShipmentByTrackingNumber(
  db: AppDatabase,
  trackingNumber: string,
) {
  const shipment = db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber.toUpperCase()))
    .get();
  if (!shipment) return null;

  const events = db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, shipment.id))
    .orderBy(asc(shipmentEvents.occurredAt), asc(shipmentEvents.id))
    .all();

  return { ...shipment, events };
}

export type ShipmentListFilters = {
  search?: string;
  status?: ShipmentStatus;
  page?: number;
};

export function listShipments(
  db: AppDatabase,
  filters: ShipmentListFilters = {},
) {
  const conditions: SQL[] = [];
  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(shipments.trackingNumber, pattern),
        like(shipments.senderName, pattern),
        like(shipments.recipientName, pattern),
      ) as SQL,
    );
  }
  if (filters.status) conditions.push(eq(shipments.status, filters.status));

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const total =
    db.select({ value: count() }).from(shipments).where(whereClause).get()
      ?.value ?? 0;
  const pages = Math.max(1, Math.ceil(total / shipmentPageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), pages);
  const offset = (page - 1) * shipmentPageSize;

  return {
    items: db
      .select()
      .from(shipments)
      .where(whereClause)
      .orderBy(desc(shipments.createdAt), desc(shipments.id))
      .limit(shipmentPageSize)
      .offset(offset)
      .all(),
    total,
    page,
    pages,
    pageSize: shipmentPageSize,
  };
}

export function advanceShipment(
  db: AppDatabase,
  trackingNumber: string,
  nextStatus: ShipmentStatus,
  staffUserId: string,
  note?: string,
  now = new Date(),
) {
  const shipment = db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber.toUpperCase()))
    .get();
  if (!shipment) return null;
  if (!canAdvanceShipment(shipment.status, nextStatus)) {
    throw new InvalidStatusTransitionError(shipment.status, nextStatus);
  }

  const timestamp = now.toISOString();
  const message =
    note?.trim() || `${shipmentStatusLabels[nextStatus]} recorded.`;
  db.transaction((transaction) => {
    const updateResult = transaction
      .update(shipments)
      .set({ status: nextStatus, updatedAt: timestamp })
      .where(
        and(
          eq(shipments.id, shipment.id),
          eq(shipments.status, shipment.status),
        ),
      )
      .run();
    if (updateResult.changes !== 1) {
      throw new InvalidStatusTransitionError(shipment.status, nextStatus);
    }
    transaction
      .insert(shipmentEvents)
      .values({
        id: randomUUID(),
        shipmentId: shipment.id,
        status: nextStatus,
        message,
        staffUserId,
        occurredAt: timestamp,
      })
      .run();
  });

  return getShipmentByTrackingNumber(db, trackingNumber);
}
