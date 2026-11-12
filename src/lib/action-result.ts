import { ZodError } from 'zod';

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export async function runAction<T>(
  label: string,
  operation: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: 'Check the highlighted details and try again.',
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }

    console.error(`${label} failed`, error);
    return { ok: false, error: 'That change could not be saved. Please try again.' };
  }
}
