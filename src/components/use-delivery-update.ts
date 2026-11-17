'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliveryStatus } from '@/lib/domain';

export type DeliveryChange = { courierId: number | null } | { status: DeliveryStatus };

export function useDeliveryUpdate(deliveryId: number) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function update(change: DeliveryChange) {
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? 'The delivery was not updated. Try again.');
        return false;
      }
      setSuccess('Delivery updated.');
      router.refresh();
      return true;
    } catch {
      setError('Could not reach the delivery service. Try again.');
      return false;
    } finally {
      setPending(false);
    }
  }

  return { update, pending, error, success };
}
