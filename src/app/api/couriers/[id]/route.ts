import { getDatabase } from '@/db';
import { updateCourier } from '@/lib/couriers';
import { withApiAuth, readJson, parseRecordId } from '@/lib/api-auth';

export function PATCH(request: Request, context: RouteContext<'/api/couriers/[id]'>) {
  return withApiAuth(request, true, async () => {
    const { id } = await context.params;
    const result = await updateCourier(getDatabase(), parseRecordId(id), await readJson(request));
    return Response.json(result);
  });
}
