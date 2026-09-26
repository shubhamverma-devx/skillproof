import { NextResponse } from 'next/server';
import { RATE_LIMITS, type RateLimitName } from '@/lib/config';
import { getStore } from '@/lib/db';
import type { ApiResult } from '@/lib/api-response';

/**
 * Identifies the caller, using only values a client cannot set for itself.
 *
 * `x-forwarded-for` is attacker controlled: anyone can send one, and a proxy
 * appends the real address rather than replacing it, so the leftmost entry is
 * whatever the caller typed. Vercel sets `x-vercel-forwarded-for` itself and
 * overwrites any incoming copy, so it is preferred, and the fallback reads the
 * rightmost entry of `x-forwarded-for`, which is the one the closest proxy
 * added. A request with no address at all is treated as one shared caller rather
 * than as unlimited.
 */
export function clientKey(request: Request): string {
  const platform = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (platform) return platform;

  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;

  const chain =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? [];

  return chain.at(-1) ?? 'unknown-client';
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

/** Counts one request against a named limit without deciding what to do about it. */
export async function consume(name: RateLimitName, request: Request): Promise<RateLimitResult> {
  const rule = RATE_LIMITS[name];
  const window = Math.floor(Date.now() / (rule.windowSeconds * 1000));
  const bucket = `${name}:${clientKey(request)}:${window}`;

  let hits: number;
  try {
    hits = await getStore().consumeRateLimit(bucket, rule.windowSeconds);
  } catch (error) {
    // A counter that cannot be read must not take the product down with it.
    console.error('rate limit check failed', error instanceof Error ? error.message : error);
    return { allowed: true };
  }

  if (hits <= rule.limit) return { allowed: true };
  return { allowed: false, retryAfter: rule.windowSeconds };
}

/**
 * Returns a 429 when the caller is over the limit, or null to carry on. Routes
 * call this first so an expensive call is never started for a request that is
 * about to be rejected.
 */
export async function rateLimit(
  name: RateLimitName,
  request: Request,
): Promise<NextResponse<ApiResult<never>> | null> {
  const result = await consume(name, request);
  if (result.allowed) return null;

  const minutes = Math.ceil(result.retryAfter / 60);
  return NextResponse.json<ApiResult<never>>(
    {
      error: `Too many requests. This endpoint calls a language model or the GitHub API, so it is limited per person. Try again in about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
  );
}
