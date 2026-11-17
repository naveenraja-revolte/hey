export const shipmentStatuses = [
  "booked",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "delivered",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  booked: "Booked",
  collected: "Collected",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivery_attempted: "Delivery attempted",
  delivered: "Delivered",
};

const allowedNextStatuses: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  booked: ["collected"],
  collected: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivery_attempted", "delivered"],
  delivery_attempted: ["out_for_delivery"],
  delivered: [],
};

export function getAllowedNextStatuses(
  status: ShipmentStatus,
): readonly ShipmentStatus[] {
  return allowedNextStatuses[status];
}

export function canAdvanceShipment(
  currentStatus: ShipmentStatus,
  nextStatus: ShipmentStatus,
): boolean {
  return getAllowedNextStatuses(currentStatus).includes(nextStatus);
}
