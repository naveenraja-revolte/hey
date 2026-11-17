import type { NextRequest } from "next/server";
import { getDatabase, type AppDatabase } from "@/db/database";
import {
  getStaffForSession,
  staffSessionCookie,
  type StaffIdentity,
} from "@/lib/auth-service";

export function sameOriginFailure(request: Request): Response | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return Response.json(
      { error: "Cross-site request blocked." },
      { status: 403 },
    );
  }

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const host = request.headers.get("host");
  try {
    if (!host || new URL(origin).host !== host) {
      return Response.json(
        { error: "Cross-site request blocked." },
        { status: 403 },
      );
    }
  } catch {
    return Response.json(
      { error: "Cross-site request blocked." },
      { status: 403 },
    );
  }

  return null;
}

export async function withStaffAuthorization(
  request: NextRequest,
  operation: (staff: StaffIdentity) => Promise<Response>,
  db: AppDatabase = getDatabase().db,
): Promise<Response> {
  const originFailure = sameOriginFailure(request);
  if (originFailure) return originFailure;

  const token = request.cookies.get(staffSessionCookie)?.value;
  const staff = getStaffForSession(db, token);
  if (!staff)
    return Response.json({ error: "Sign in to continue." }, { status: 401 });

  return operation(staff);
}

export function genericServerError(context: string, error: unknown): Response {
  console.error(context, error);
  return Response.json(
    { error: "We could not complete that request. Try again." },
    { status: 500 },
  );
}
