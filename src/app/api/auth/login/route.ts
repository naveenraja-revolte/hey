import { createSessionToken, assertSameOrigin, sessionCookie, verifyCredentials } from '@/lib/auth';
import { signInSchema } from '@/lib/validation';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: 'Cross-site request blocked' }, { status: 403 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4_000) {
      return Response.json({ error: 'Request body is too large' }, { status: 413 });
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json({ error: 'Enter a valid request body' }, { status: 400 });
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Enter a valid email and password' }, { status: 400 });
  }
  if (!(await verifyCredentials(parsed.data.email, parsed.data.password))) {
    console.info('Dispatcher sign-in rejected');
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const session = createSessionToken();
  console.info('Dispatcher sign-in accepted');
  return Response.json(
    { signedIn: true },
    {
      headers: {
        'Set-Cookie': sessionCookie(
          session.token,
          session.expiresAt - Math.floor(Date.now() / 1000)
        ),
      },
    }
  );
}
