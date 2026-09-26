import { GithubError, hasGithubToken } from '@/lib/github/client';
import { scanGithubUser } from '@/lib/github/scan';
import type { GithubScan } from '@/lib/github/types';
import { detectSkillsFromRepo, mergeDetections } from '@/lib/skills/detect';
import type { ObservedSource } from '@/types/domain';
import type { Tracer } from './trace';

export type GithubIngestResult = {
  scan: GithubScan | null;
  /** Canonical skill name to every file that proved it. */
  observed: Map<string, ObservedSource[]>;
  warning: string | null;
};

const EMPTY: GithubIngestResult = { scan: null, observed: new Map(), warning: null };

/**
 * Scans public repositories and records which file proved each skill. Any GitHub
 * failure degrades to resume only evidence with a warning on the trace, because
 * a missing token or a wrong username must not end the analysis.
 */
export async function ingestGithub(
  username: string | null,
  tracer: Tracer,
  cachedScan?: GithubScan,
): Promise<GithubIngestResult> {
  if (!username) {
    await tracer.info('GitHub skipped', 'No GitHub username given, using resume evidence only');
    return EMPTY;
  }

  let scan: GithubScan;
  if (cachedScan) {
    scan = cachedScan;
    await tracer.info(
      'GitHub scan loaded from cache',
      `Demo profile: ${scan.repos.length} repositories of ${scan.username}`,
    );
  } else {
    if (!hasGithubToken()) {
      await tracer.warn(
        'No GitHub token',
        'Unauthenticated rate limit is 60 requests an hour, so the scan is capped at 8 repositories',
      );
    }
    try {
      scan = await scanGithubUser(username);
      await tracer.info(
        'Repositories fetched',
        `${scan.activity.scanned_repos} of ${scan.activity.public_repos} public repositories scanned for ${username}`,
      );
    } catch (error) {
      return { ...EMPTY, warning: await reportFailure(error, username, tracer) };
    }
  }

  const observed = mergeDetections(scan.repos.map((repo) => detectSkillsFromRepo(repo)));
  await logDetections(observed, tracer);

  return { scan, observed, warning: null };
}

async function logDetections(
  observed: Map<string, ObservedSource[]>,
  tracer: Tracer,
): Promise<void> {
  const examples = [...observed.entries()].slice(0, 6);
  for (const [skill, sources] of examples) {
    const first = sources[0];
    if (!first) continue;
    await tracer.info(
      'Skill observed in code',
      `${skill} detected from ${first.file} in repository ${first.repo}`,
    );
  }
  await tracer.info(
    'Code evidence complete',
    `${observed.size} skills observed across the scanned repositories`,
  );
}

async function reportFailure(
  error: unknown,
  username: string,
  tracer: Tracer,
): Promise<string> {
  if (error instanceof GithubError) {
    const message =
      error.kind === 'not_found'
        ? `GitHub user ${username} not found. Check the username or continue with your resume only.`
        : error.kind === 'rate_limit'
          ? `${error.message}. Continuing with resume evidence only. Add GITHUB_TOKEN to raise the limit.`
          : `${error.message}. Continuing with resume evidence only.`;
    await tracer.warn('GitHub scan failed', message);
    return message;
  }

  const message = `GitHub scan failed: ${
    error instanceof Error ? error.message : 'unknown error'
  }. Continuing with resume evidence only.`;
  await tracer.error('GitHub scan failed', message);
  return message;
}
