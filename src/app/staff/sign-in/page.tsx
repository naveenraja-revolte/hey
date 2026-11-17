import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/app/staff/sign-in/sign-in-form";
import { getDatabase } from "@/db/database";
import { getStaffForSession, staffSessionCookie } from "@/lib/auth-service";

export const metadata = { title: "Staff sign in | Parcel delivery" };

export default async function StaffSignInPage() {
  await connection();
  const cookieStore = await cookies();
  const staff = getStaffForSession(
    getDatabase().db,
    cookieStore.get(staffSessionCookie)?.value,
  );
  if (staff) redirect("/staff/shipments");

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6 sm:py-16"
    >
      <header className="animate-fade-in-up mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Staff sign in
        </h1>
        <p className="text-muted-foreground mt-3 leading-7 text-pretty">
          Sign in to manage parcel updates and delivery progress.
        </p>
      </header>
      <section className="animate-fade-in-up rounded-container border-border bg-card border p-6 shadow-sm sm:p-8">
        <SignInForm />
      </section>
    </main>
  );
}
