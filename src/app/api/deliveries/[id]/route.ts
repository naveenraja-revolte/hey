import { getDatabase } from '@/db';
import { getDelivery, updateDelivery } from '@/lib/deliveries';
import { withApiAuth, readJson, parseRecordId } from '@/lib/api-auth';

export function GET(request: Request, context: RouteContext<'/api/deliveries/[id]'>) {
  return withApiAuth(request, false, async () => {
    const { id } = await context.params;
    return Response.json(await getDelivery(getDatabase(), parseRecordId(id)));
  });
}

export function PATCH(request: Request, context: RouteContext<'/api/deliveries/[id]'>) {
  return withApiAuth(request, true, async () => {
    const { id } = await context.params;
    const result = await updateDelivery(getDatabase(), parseRecordId(id), await readJson(request));
    return Response.json(result);
  });
}
