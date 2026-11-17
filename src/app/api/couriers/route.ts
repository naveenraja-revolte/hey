import { getDatabase } from '@/db';
import { createCourier, listCouriers } from '@/lib/couriers';
import { withApiAuth, readJson } from '@/lib/api-auth';

export function GET(request: Request) {
  return withApiAuth(request, false, async () => {
    const search = new URL(request.url).searchParams;
    return Response.json(await listCouriers(getDatabase(), Object.fromEntries(search)));
  });
}

export function POST(request: Request) {
  return withApiAuth(request, true, async () => {
    const courier = await createCourier(getDatabase(), await readJson(request));
    return Response.json(courier, { status: 201 });
  });
}
