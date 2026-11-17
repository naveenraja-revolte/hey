import { NextRequest, NextResponse } from "next/server";
import { getDatabase, type AppDatabase } from "@/db/database";
import {
  clearFailedLogins,
  createStaffSession,
  hashClientAddress,
  isLoginAddressBlocked,
  recordFailedLogin,
  staffSessionCookie,
  verifyStaffPassword,
} from "@/lib/auth-service";
import { genericServerError, sameOriginFailure } from "@/lib/http-security";
import { staffSignInSchema } from "@/lib/validation";

function clientAddress(request: NextRequest): string | null {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleStaffSignIn(request, getDatabase().db);
}

export async function handleStaffSignIn(
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
      { error: "Send valid sign-in details." },
      { status: 400 },
    );
  }

  const parsed = staffSignInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Enter your email and password.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const addressHash = hashClientAddress(clientAddress(request));
    if (isLoginAddressBlocked(db, addressHash)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    }

    const staff = await verifyStaffPassword(
      db,
      parsed.data.email,
      parsed.data.password,
    );
    if (!staff) {
      recordFailedLogin(db, addressHash);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    clearFailedLogins(db, addressHash);
    const session = createStaffSession(db, staff.id);
    const response = NextResponse.json({ email: staff.email });
    response.cookies.set({
      name: staffSessionCookie,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(session.expiresAt),
      path: "/",
    });
    return response;
  } catch (error) {
    return genericServerError("Unable to sign in staff.", error);
  }
}
