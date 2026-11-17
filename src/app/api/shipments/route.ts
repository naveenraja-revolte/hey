import { NextRequest, NextResponse } from "next/server";
import { getDatabase, type AppDatabase } from "@/db/database";
import { sameOriginFailure, genericServerError } from "@/lib/http-security";
import { createShipment } from "@/lib/shipment-service";
import { shipmentCreationSchema } from "@/lib/validation";

export async function POST(request: NextRequest): Promise<Response> {
  return createShipmentRequest(request, getDatabase().db);
}

export async function createShipmentRequest(
  request: NextRequest,
  db: AppDatabase,
): Promise<Response> {
  const originFailure = sameOriginFailure(request);
  if (originFailure) return originFailure;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send the shipment details as valid JSON." },
      { status: 400 },
    );
  }

  const parsed = shipmentCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the highlighted shipment details.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const shipment = createShipment(db, parsed.data);
    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    return genericServerError("Unable to create a shipment.", error);
  }
}
