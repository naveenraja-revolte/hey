import { assertSameOrigin, expiredSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: 'Cross-site request blocked' }, { status: 403 });
  }
  return Response.json({ signedIn: false }, { headers: { 'Set-Cookie': expiredSessionCookie() } });
}
