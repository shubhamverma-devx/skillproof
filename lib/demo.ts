import demoGithubScan from '@/data/demo/github_scan.json';
import demoProfile from '@/data/demo/profile.json';
import demoProgressRepo from '@/data/demo/progress_repo.json';
import type { GithubScan, RepoSignals } from '@/lib/github/types';
import type { GithubSummary } from '@/types/domain';

export type DemoSeed = {
  name: string;
  target_role: string;
  weekly_hours: number;
  github_username: string;
  resume_text: string;
};

export function isDemoModeForced(): boolean {
  return process.env.DEMO_MODE === 'true';
}

export function getDemoSeed(): DemoSeed {
  const seed = demoProfile as DemoSeed;
  return {
    name: seed.name,
    target_role: seed.target_role,
    weekly_hours: seed.weekly_hours,
    github_username: seed.github_username,
    resume_text: seed.resume_text,
  };
}

/** Cached scan of the demo student's repositories, so the demo needs no network. */
export function getDemoScan(): GithubScan {
  return demoGithubScan as GithubScan;
}

/** The repository the student links during the demo to prove Docker and deployment. */
export function getDemoProgressRepo(): RepoSignals {
  return demoProgressRepo as RepoSignals;
}

export function summariseScan(scan: GithubScan): GithubSummary {
  return {
    username: scan.username,
    public_repos: scan.activity.public_repos,
    scanned_repos: scan.activity.scanned_repos,
    last_push: scan.activity.last_push,
    active_months: scan.activity.active_months,
    repos: scan.repos.map((repo) => ({
      name: repo.repo,
      pushed_at: repo.pushed_at,
      primary_language: repo.languages[0] ?? null,
    })),
  };
}
