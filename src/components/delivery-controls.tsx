import type { CourierOption, DeliveryControlRecord } from './delivery-control-types';
import { DeliveryAssignmentControl } from './delivery-assignment-control';
import { DeliveryProgressControl } from './delivery-progress-control';

export function DeliveryControls({
  delivery,
  couriers,
}: {
  delivery: DeliveryControlRecord;
  couriers: CourierOption[];
}) {
  const canAssign = delivery.status === 'unassigned' || delivery.status === 'assigned';
  return (
    <aside className="rounded-container border-border bg-card h-fit space-y-5 border p-5">
      <h2 className="font-heading text-xl font-semibold">Dispatch actions</h2>
      {canAssign && <DeliveryAssignmentControl delivery={delivery} couriers={couriers} />}
      <DeliveryProgressControl delivery={delivery} />
    </aside>
  );
}
