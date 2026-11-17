import { z } from 'zod';

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message])
    );
    return Response.json({ error: 'Check the highlighted fields', fieldErrors }, { status: 400 });
  }
  console.error('Unhandled request error', error);
  return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
}
