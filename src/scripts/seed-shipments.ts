import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/database";
import { staffUsers } from "@/db/schema";
import {
  advanceShipment,
  createShipment,
  getShipmentByTrackingNumber,
} from "@/lib/shipment-service";
import type { ShipmentStatus } from "@/lib/shipment-status";

const samples: Array<{
  trackingNumber: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  parcelDescription: string;
  progress: ShipmentStatus[];
}> = [
  {
    trackingNumber: "PD-DEMO000001",
    senderName: "Morgan Lee",
    senderEmail: "morgan@example.com",
    senderAddress: "18 River Street, Portland, OR",
    recipientName: "Avery Chen",
    recipientAddress: "42 Pine Avenue, Salem, OR",
    parcelDescription: "Books and stationery",
    progress: [],
  },
  {
    trackingNumber: "PD-DEMO000002",
    senderName: "Jamie Patel",
    senderEmail: "jamie@example.com",
    senderAddress: "77 Oak Lane, Eugene, OR",
    recipientName: "Riley Brooks",
    recipientAddress: "9 Cedar Court, Bend, OR",
    parcelDescription: "Kitchen accessories",
    progress: ["collected"],
  },
  {
    trackingNumber: "PD-DEMO000003",
    senderName: "Taylor Reed",
    senderEmail: "taylor@example.com",
    senderAddress: "5 Market Street, Portland, OR",
    recipientName: "Casey Nguyen",
    recipientAddress: "120 Lake Road, Corvallis, OR",
    parcelDescription: "Printed photographs",
    progress: ["collected", "in_transit"],
  },
  {
    trackingNumber: "PD-DEMO000004",
    senderName: "Jordan Park",
    senderEmail: "jordan@example.com",
    senderAddress: "33 Alder Way, Salem, OR",
    recipientName: "Drew Miller",
    recipientAddress: "16 Pine Street, Medford, OR",
    parcelDescription: "Winter clothing",
    progress: ["collected", "in_transit", "out_for_delivery"],
  },
  {
    trackingNumber: "PD-DEMO000005",
    senderName: "Alex Rivera",
    senderEmail: "alex@example.com",
    senderAddress: "81 West Street, Bend, OR",
    recipientName: "Sam Carter",
    recipientAddress: "7 Hillcrest Avenue, Eugene, OR",
    parcelDescription: "Board game and accessories",
    progress: [
      "collected",
      "in_transit",
      "out_for_delivery",
      "delivery_attempted",
    ],
  },
  {
    trackingNumber: "PD-DEMO000006",
    senderName: "Robin Ellis",
    senderEmail: "robin@example.com",
    senderAddress: "22 Grove Road, Corvallis, OR",
    recipientName: "Kris Bennett",
    recipientAddress: "54 Maple Avenue, Portland, OR",
    parcelDescription: "Handmade ceramic cups",
    progress: ["collected", "in_transit", "out_for_delivery", "delivered"],
  },
];

const { client, db } = getDatabase();
try {
  const staff = db
    .select({ id: staffUsers.id })
    .from(staffUsers)
    .where(
      eq(staffUsers.email, process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? ""),
    )
    .get();
  if (!staff)
    throw new Error("Run npm run db:bootstrap before seeding shipments.");

  for (const sample of samples) {
    if (getShipmentByTrackingNumber(db, sample.trackingNumber)) continue;
    const created = createShipment(
      db,
      {
        senderName: sample.senderName,
        senderEmail: sample.senderEmail,
        senderAddress: sample.senderAddress,
        recipientName: sample.recipientName,
        recipientAddress: sample.recipientAddress,
        parcelDescription: sample.parcelDescription,
      },
      { createTrackingNumber: () => sample.trackingNumber },
    );
    for (const status of sample.progress) {
      advanceShipment(db, created.trackingNumber, status, staff.id);
    }
  }

  process.stdout.write(
    `Ensured ${samples.length} sample shipments are available.\n`,
  );
} finally {
  client.close();
}
