import { assertSameOrigin, readSessionFromRequest } from './auth';
import { AppError, toErrorResponse } from './errors';

export function authorizeRequest(request: Request, mutation = false) {
  if (mutation && !assertSameOrigin(request)) {
    return Response.json({ error: 'Cross-site request blocked' }, { status: 403 });
  }
  if (!readSessionFromRequest(request)) {
    return Response.json({ error: 'Sign in to continue' }, { status: 401 });
  }
  return null;
}

export async function withApiAuth(
  request: Request,
  mutation: boolean,
  action: () => Promise<Response>
) {
  const rejected = authorizeRequest(request, mutation);
  if (rejected) return rejected;
  try {
    return await action();
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function readJson(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 64_000) {
    throw new AppError('Request body is too large', 413);
  }
  const body = await request.text();
  if (body.length > 64_000) throw new AppError('Request body is too large', 413);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError('Enter a valid JSON request body', 400);
  }
}

export function parseRecordId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError('Invalid record id', 400);
  return id;
}
