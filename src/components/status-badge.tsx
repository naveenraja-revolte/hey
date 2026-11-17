import {
  shipmentStatusLabels,
  type ShipmentStatus,
} from "@/lib/shipment-status";

const statusStyles: Record<ShipmentStatus, string> = {
  booked: "bg-info/10 text-info",
  collected: "bg-info/10 text-info",
  in_transit: "bg-info/10 text-info",
  out_for_delivery: "bg-warning/10 text-warning",
  delivery_attempted: "bg-destructive/10 text-destructive",
  delivered: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusStyles[status]}`}
    >
      {shipmentStatusLabels[status]}
    </span>
  );
}
