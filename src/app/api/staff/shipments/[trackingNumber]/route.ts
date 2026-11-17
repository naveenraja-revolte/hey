import { NextRequest, NextResponse } from "next/server";
import { getDatabase, type AppDatabase } from "@/db/database";
import {
  withStaffAuthorization,
  genericServerError,
} from "@/lib/http-security";
import {
  advanceShipment,
  InvalidStatusTransitionError,
} from "@/lib/shipment-service";
import { shipmentStatusUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ trackingNumber: string }> };

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  return updateShipmentStatus(request, context, getDatabase().db);
}

export async function updateShipmentStatus(
  request: NextRequest,
  context: RouteContext,
  db: AppDatabase,
): Promise<Response> {
  return withStaffAuthorization(
    request,
    async (staff) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Send a valid status update." },
          { status: 400 },
        );
      }

      const parsed = shipmentStatusUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Choose a valid next status.",
            fields: parsed.error.flatten().fieldErrors,
          },
          { status: 422 },
        );
      }

      try {
        const { trackingNumber } = await context.params;
        const shipment = advanceShipment(
          db,
          trackingNumber,
          parsed.data.status,
          staff.id,
          parsed.data.note,
        );
        if (!shipment)
          return NextResponse.json(
            { error: "Shipment not found." },
            { status: 404 },
          );
        return NextResponse.json({ shipment });
      } catch (error) {
        if (error instanceof InvalidStatusTransitionError) {
          return NextResponse.json(
            { error: "That status cannot follow the current status." },
            { status: 409 },
          );
        }
        return genericServerError("Unable to update shipment status.", error);
      }
    },
    db,
  );
}
