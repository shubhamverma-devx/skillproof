import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Every route answers with `{ data }` or `{ error }`, never a bare value. */
export type ApiResult<T> = { data: T } | { error: string };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResult<T>>({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiResult<never>>({ error: message }, { status });
}

/**
 * Turns anything thrown inside a route into the shared error shape. Zod issues
 * become a readable field list so the onboarding form can show them as is.
 */
export function failFromError(error: unknown, fallbackStatus = 500) {
  if (error instanceof ZodError) {
    const detail = error.issues
      .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
      .join('; ');
    return fail(`Invalid input. ${detail}`, 422);
  }
  if (error instanceof Error) return fail(error.message, fallbackStatus);
  return fail('Something went wrong. Please try again.', fallbackStatus);
}
