export const DELIVERY_STATUSES = [
  'unassigned',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = ['assigned', 'picked_up', 'in_transit'];

export const STATUS_BADGE_CLASSES: Record<DeliveryStatus, string> = {
  unassigned: 'bg-warning/10 text-warning',
  assigned: 'bg-info/10 text-info',
  picked_up: 'bg-accent/15 text-foreground',
  in_transit: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  unassigned: 'Unassigned',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  unassigned: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const PAGE_SIZE = 20;
