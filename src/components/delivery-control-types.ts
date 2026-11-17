import type { DeliveryStatus } from '@/lib/domain';

export type DeliveryControlRecord = {
  id: number;
  status: DeliveryStatus;
  courierId: number | null;
};

export type CourierOption = { id: number; name: string };
