import { Suspense } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getDatabase } from "@/db/database";
import { getStaffForSession, staffSessionCookie } from "@/lib/auth-service";
import { listShipments } from "@/lib/shipment-service";
import { shipmentStatuses, type ShipmentStatus } from "@/lib/shipment-status";
import { ShipmentFilters } from "@/app/staff/shipments/shipment-filters";
import { ShipmentOperations } from "@/app/staff/shipments/shipment-operations";

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export const metadata = { title: "Manage shipments | Parcel delivery" };

function validStatus(value: string | undefined): ShipmentStatus | undefined {
  return shipmentStatuses.find((status) => status === value);
}

export default async function StaffShipmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const cookieStore = await cookies();
  const staff = getStaffForSession(
    getDatabase().db,
    cookieStore.get(staffSessionCookie)?.value,
  );
  if (!staff) redirect("/staff/sign-in");

  const query = await searchParams;
  const search = query.q?.trim() ?? "";
  const status = validStatus(query.status);
  const pageNumber = Number(query.page ?? "1");
  const result = listShipments(getDatabase().db, {
    search,
    status,
    page: Number.isFinite(pageNumber) ? Math.max(1, Math.floor(pageNumber)) : 1,
  });

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
    >
      <header className="animate-fade-in-up mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Delivery operations
          </p>
          <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Shipments
          </h1>
          <p className="text-muted-foreground mt-3">
            Signed in as {staff.email}
          </p>
        </div>
        <SignOutButton />
      </header>
      <section className="animate-fade-in-up rounded-container border-border bg-card border p-4 shadow-sm sm:p-6">
        <Suspense
          fallback={
            <div className="rounded-control bg-muted h-14 animate-pulse" />
          }
        >
          <ShipmentFilters
            key={`${search}-${status ?? ""}`}
            initialSearch={search}
            initialStatus={status ?? ""}
          />
        </Suspense>
        <ShipmentOperations
          result={result}
          hasFilters={Boolean(search || status)}
          query={{ search, status }}
        />
      </section>
    </main>
  );
}
