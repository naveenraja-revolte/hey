import { getDatabase } from '@/db';
import { createDelivery, listDeliveries } from '@/lib/deliveries';
import { withApiAuth, readJson } from '@/lib/api-auth';

export function GET(request: Request) {
  return withApiAuth(request, false, async () => {
    const search = new URL(request.url).searchParams;
    return Response.json(await listDeliveries(getDatabase(), Object.fromEntries(search)));
  });
}

export function POST(request: Request) {
  return withApiAuth(request, true, async () => {
    const body = await readJson(request);
    const delivery = await createDelivery(getDatabase(), body);
    return Response.json(delivery, { status: 201 });
  });
}
