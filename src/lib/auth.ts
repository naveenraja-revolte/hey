import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signInSchema } from './validation';

const sessionCookieName = 'dispatch_session';
const sessionDurationSeconds = 8 * 60 * 60;
const sessionPayloadSchema = z.object({ sub: z.literal('dispatcher'), exp: z.number().int() });
const dummyPasswordHash = bcrypt.hashSync('not-a-real-dispatch-password', 10);
let configuredPasswordHash: Promise<string> | undefined;

function requiredSecret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must contain at least 32 characters`);
  return value;
}

export async function verifyCredentials(email: string, password: string) {
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) return false;

  const configuredEmail = process.env.DISPATCHER_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.DISPATCHER_PASSWORD;
  const knownEmail = configuredEmail === parsed.data.email.toLowerCase();
  if (configuredPassword && !configuredPasswordHash) {
    configuredPasswordHash = bcrypt.hash(configuredPassword, 10);
  }
  const comparisonHash =
    knownEmail && configuredPasswordHash ? await configuredPasswordHash : dummyPasswordHash;
  const passwordMatches = await bcrypt.compare(parsed.data.password, comparisonHash);
  return Boolean(configuredEmail && configuredPassword && knownEmail && passwordMatches);
}

export function createSessionToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + sessionDurationSeconds;
  const payload = Buffer.from(JSON.stringify({ sub: 'dispatcher', exp: expiresAt })).toString(
    'base64url'
  );
  const signature = createHmac('sha256', requiredSecret('AUTH_SECRET'))
    .update(payload)
    .digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token || token.length > 1024) return false;
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra !== undefined) return false;
  const expectedSignature = createHmac('sha256', requiredSecret('AUTH_SECRET'))
    .update(payload)
    .digest();
  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(suppliedSignature, 'base64url');
  } catch {
    return false;
  }
  if (actualSignature.length !== expectedSignature.length) return false;
  if (!timingSafeEqual(actualSignature, expectedSignature)) return false;

  try {
    const session = sessionPayloadSchema.parse(
      JSON.parse(Buffer.from(payload, 'base64url').toString())
    );
    return session.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function readSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${sessionCookieName}=`));
  return verifySessionToken(cookie?.slice(sessionCookieName.length + 1));
}

export function sessionCookie(token: string, maxAge: number) {
  const flags = [
    `${sessionCookieName}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

export function expiredSessionCookie() {
  return sessionCookie('', 0);
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get('host')) return false;
    } catch {
      return false;
    }
  }
  return true;
}
