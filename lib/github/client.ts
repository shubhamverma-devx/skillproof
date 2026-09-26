import { GITHUB } from '@/lib/config';

export type GithubErrorKind = 'rate_limit' | 'not_found' | 'network' | 'other';

export class GithubError extends Error {
  constructor(
    message: string,
    readonly kind: GithubErrorKind,
  ) {
    super(message);
    this.name = 'GithubError';
  }
}

function headers(): HeadersInit {
  const base: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'skillproof-agent',
  };
  if (process.env.GITHUB_TOKEN) base.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return base;
}

export function hasGithubToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

/**
 * Single GitHub request with classified failures, so callers can decide between
 * "continue with resume only" and "this repo simply has no such file".
 */
export async function githubFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB.apiRoot}${path}`, {
      headers: headers(),
      signal: AbortSignal.timeout(GITHUB.requestTimeoutMs),
      cache: 'no-store',
    });
  } catch (error) {
    throw new GithubError(
      `GitHub request failed: ${error instanceof Error ? error.message : 'network error'}`,
      'network',
    );
  }

  if (response.ok) return (await response.json()) as T;

  if (response.status === 404) {
    throw new GithubError(`Not found: ${path}`, 'not_found');
  }

  const remaining = response.headers.get('x-ratelimit-remaining');
  if ((response.status === 403 || response.status === 429) && remaining === '0') {
    const resetAt = response.headers.get('x-ratelimit-reset');
    const minutes = resetAt
      ? Math.max(1, Math.ceil((Number(resetAt) * 1000 - Date.now()) / 60_000))
      : null;
    throw new GithubError(
      `GitHub rate limit reached${minutes ? `, resets in about ${minutes} minutes` : ''}`,
      'rate_limit',
    );
  }

  throw new GithubError(`GitHub responded ${response.status} for ${path}`, 'other');
}

/** Repository file contents come back base64 encoded from the contents endpoint. */
export function decodeBase64(content: string): string {
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8');
}
