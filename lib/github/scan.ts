import { GITHUB } from '@/lib/config';
import { parseDependencies } from '@/lib/skills/detect';
import { decodeBase64, githubFetch, GithubError, hasGithubToken } from './client';
import type { GithubContent, GithubRepo, GithubScan, GithubTree, RepoSignals } from './types';

const MANIFEST_PATHS = ['package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile'];

/** Without a token GitHub allows 60 requests an hour, which is about 8 repos. */
function repoBudget(): number {
  return hasGithubToken() ? GITHUB.maxRepos : 8;
}

export async function fetchUserRepos(username: string): Promise<GithubRepo[]> {
  const repos = await githubFetch<GithubRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`,
  );
  return repos.filter((repo) => !repo.fork);
}

async function fetchLanguages(fullName: string): Promise<string[]> {
  try {
    const languages = await githubFetch<Record<string, number>>(`/repos/${fullName}/languages`);
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .map(([language]) => language);
  } catch {
    return [];
  }
}

async function fetchTreePaths(fullName: string, branch: string): Promise<string[]> {
  try {
    const tree = await githubFetch<GithubTree>(
      `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    );
    return tree.tree.map((node) => node.path);
  } catch (error) {
    if (error instanceof GithubError && error.kind === 'rate_limit') throw error;
    return [];
  }
}

async function fetchTextFile(fullName: string, path: string): Promise<string | null> {
  try {
    const file = await githubFetch<GithubContent>(`/repos/${fullName}/contents/${path}`);
    return file.encoding === 'base64' ? decodeBase64(file.content) : file.content;
  } catch (error) {
    if (error instanceof GithubError && error.kind === 'rate_limit') throw error;
    return null;
  }
}

async function fetchReadme(fullName: string): Promise<string> {
  try {
    const file = await githubFetch<GithubContent>(`/repos/${fullName}/readme`);
    const text = file.encoding === 'base64' ? decodeBase64(file.content) : file.content;
    return text.slice(0, GITHUB.readmeSnippetChars);
  } catch (error) {
    if (error instanceof GithubError && error.kind === 'rate_limit') throw error;
    return '';
  }
}

/**
 * Collects code evidence for one repository. The file tree is fetched once and
 * manifests are then requested only when the tree proves they exist, which keeps
 * a full scan inside the unauthenticated rate limit.
 */
export async function scanRepo(repo: GithubRepo): Promise<RepoSignals> {
  const [languages, files] = await Promise.all([
    fetchLanguages(repo.full_name),
    fetchTreePaths(repo.full_name, repo.default_branch),
  ]);

  const manifestPaths = MANIFEST_PATHS.filter((path) => files.includes(path));
  const dependencies: RepoSignals['dependencies'] = [];
  for (const path of manifestPaths) {
    const content = await fetchTextFile(repo.full_name, path);
    if (!content) continue;
    for (const name of parseDependencies(path, content)) {
      dependencies.push({ name, file: path });
    }
  }

  return {
    repo: repo.name,
    description: repo.description ?? '',
    languages: languages.length > 0 ? languages : repo.language ? [repo.language] : [],
    topics: repo.topics ?? [],
    files,
    dependencies,
    readme: await fetchReadme(repo.full_name),
    pushed_at: repo.pushed_at,
  };
}

/** Scans one repository, used when a student links a new project as evidence. */
export async function scanSingleRepo(fullName: string): Promise<RepoSignals> {
  const repo = await githubFetch<GithubRepo>(`/repos/${fullName}`);
  return scanRepo(repo);
}

/** Accepts a full GitHub URL or an owner/name pair and returns owner/name. */
export function parseRepoReference(input: string): string | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const fromUrl = trimmed.match(/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)/);
  if (fromUrl?.[1] && fromUrl[2]) return `${fromUrl[1]}/${fromUrl[2]}`;
  const direct = trimmed.match(/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  if (direct?.[1] && direct[2]) return `${direct[1]}/${direct[2]}`;
  return null;
}

function countActiveMonths(dates: string[]): number {
  const months = new Set(dates.map((date) => date.slice(0, 7)));
  return months.size;
}

/** Scans the most recently pushed repositories, newest first. */
export async function scanGithubUser(username: string): Promise<GithubScan> {
  const repos = await fetchUserRepos(username);
  const selected = repos
    .filter((repo) => !repo.archived)
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, repoBudget());

  const signals: RepoSignals[] = [];
  for (const repo of selected) {
    signals.push(await scanRepo(repo));
  }

  return {
    username,
    repos: signals,
    activity: {
      public_repos: repos.length,
      scanned_repos: signals.length,
      last_push: selected[0]?.pushed_at ?? null,
      active_months: countActiveMonths(selected.map((repo) => repo.pushed_at)),
    },
  };
}
