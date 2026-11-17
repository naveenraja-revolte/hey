import { NextRequest, NextResponse } from "next/server";
import { getDatabase, type AppDatabase } from "@/db/database";
import { revokeStaffSession, staffSessionCookie } from "@/lib/auth-service";
import {
  genericServerError,
  withStaffAuthorization,
} from "@/lib/http-security";

export async function POST(request: NextRequest): Promise<Response> {
  return handleStaffSignOut(request, getDatabase().db);
}

export async function handleStaffSignOut(
  request: NextRequest,
  db: AppDatabase,
): Promise<Response> {
  return withStaffAuthorization(
    request,
    async () => {
      try {
        const token = request.cookies.get(staffSessionCookie)?.value;
        revokeStaffSession(db, token);
        const response = NextResponse.json({ success: true });
        response.cookies.set({
          name: staffSessionCookie,
          value: "",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 0,
          path: "/",
        });
        return response;
      } catch (error) {
        return genericServerError("Unable to sign out staff.", error);
      }
    },
    db,
  );
}
