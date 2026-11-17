import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertSameOrigin,
  createSessionToken,
  readSessionFromRequest,
  sessionCookie,
  verifyCredentials,
  verifySessionToken,
} from '../lib/auth';
import { authorizeRequest, readJson } from '../lib/api-auth';
import { POST as login } from '../app/api/auth/login/route';

process.env.AUTH_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.DISPATCHER_EMAIL = 'dispatch@example.test';
process.env.DISPATCHER_PASSWORD = 'test-password-that-is-not-used-outside-tests';

const testNow = 1_800_000_000_000;

test('configured dispatcher credentials accept only the matching email and password', async () => {
  assert.equal(
    await verifyCredentials('dispatch@example.test', process.env.DISPATCHER_PASSWORD ?? ''),
    true
  );
  assert.equal(
    await verifyCredentials('other@example.test', process.env.DISPATCHER_PASSWORD ?? ''),
    false
  );
  assert.equal(await verifyCredentials('dispatch@example.test', 'incorrect-password'), false);
});

test('login endpoint sets a protected session and rejects invalid credentials', async () => {
  const validRequest = new Request('https://dispatch.test/api/auth/login', {
    method: 'POST',
    headers: {
      host: 'dispatch.test',
      origin: 'https://dispatch.test',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: process.env.DISPATCHER_EMAIL,
      password: process.env.DISPATCHER_PASSWORD,
    }),
  });
  const accepted = await login(validRequest);
  assert.equal(accepted.status, 200);
  assert.match(accepted.headers.get('set-cookie') ?? '', /HttpOnly/);

  const rejected = await login(
    new Request('https://dispatch.test/api/auth/login', {
      method: 'POST',
      headers: {
        host: 'dispatch.test',
        origin: 'https://dispatch.test',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: process.env.DISPATCHER_EMAIL, password: 'incorrect-password' }),
    })
  );
  assert.equal(rejected.status, 401);
});

test('signed sessions expire and reject tampering', () => {
  const { token, expiresAt } = createSessionToken(testNow);
  assert.equal(verifySessionToken(token, testNow), true);
  assert.equal(verifySessionToken(token, (expiresAt + 1) * 1000), false);
  assert.equal(verifySessionToken(`${token}x`, testNow), false);
});

test('API authorization rejects missing sessions and cross-origin mutations', () => {
  const unauthorized = authorizeRequest(new Request('https://dispatch.test/api/deliveries'));
  assert.equal(unauthorized?.status, 401);

  const { token } = createSessionToken(testNow);
  const request = new Request('https://dispatch.test/api/deliveries', {
    method: 'POST',
    headers: {
      cookie: sessionCookie(token, 3600),
      host: 'dispatch.test',
      origin: 'https://attacker.test',
      'sec-fetch-site': 'cross-site',
    },
  });
  assert.equal(assertSameOrigin(request), false);
  assert.equal(authorizeRequest(request, true)?.status, 403);
});

test('request parsing rejects invalid and oversized JSON bodies', async () => {
  await assert.rejects(
    readJson(new Request('https://dispatch.test', { method: 'POST', body: '{' }))
  );
  await assert.rejects(
    readJson(
      new Request('https://dispatch.test', {
        method: 'POST',
        headers: { 'content-length': '64001' },
        body: '{}',
      })
    )
  );
});

test('session cookie is httpOnly and strict same-site', () => {
  const cookie = sessionCookie('signed-token', 3600);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(
    readSessionFromRequest(new Request('https://dispatch.test', { headers: { cookie } })),
    false
  );
});
