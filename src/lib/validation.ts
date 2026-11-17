import { z } from "zod";
import { shipmentStatuses } from "@/lib/shipment-status";

const optionalPhone = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(40, "Use 40 characters or fewer.").optional(),
);

export const shipmentCreationSchema = z
  .object({
    senderName: z.string().trim().min(2, "Enter the sender's name.").max(100),
    senderEmail: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254),
    senderPhone: optionalPhone,
    senderAddress: z
      .string()
      .trim()
      .min(5, "Enter the pickup address.")
      .max(300),
    recipientName: z
      .string()
      .trim()
      .min(2, "Enter the recipient's name.")
      .max(100),
    recipientPhone: optionalPhone,
    recipientAddress: z
      .string()
      .trim()
      .min(5, "Enter the delivery address.")
      .max(300),
    parcelDescription: z
      .string()
      .trim()
      .min(3, "Describe the parcel.")
      .max(160, "Use 160 characters or fewer."),
  })
  .strict();

export const staffSignInSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address.").max(254),
    password: z.string().min(1, "Enter your password.").max(200),
  })
  .strict();

export const shipmentStatusUpdateSchema = z
  .object({
    status: z.enum(shipmentStatuses),
    note: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().trim().max(500, "Use 500 characters or fewer.").optional(),
    ),
  })
  .strict();

export type ShipmentCreationInput = z.infer<typeof shipmentCreationSchema>;
export type ShipmentStatusUpdateInput = z.infer<
  typeof shipmentStatusUpdateSchema
>;
