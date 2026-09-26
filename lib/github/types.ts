export type GithubRepo = {
  name: string;
  full_name: string;
  fork: boolean;
  archived: boolean;
  language: string | null;
  topics?: string[];
  default_branch: string;
  pushed_at: string;
  stargazers_count: number;
  description: string | null;
};

export type GithubTree = {
  truncated: boolean;
  tree: Array<{ path: string; type: 'blob' | 'tree' }>;
};

export type GithubContent = { content: string; encoding: string };

/** Everything the deterministic detector needs from one repository. */
export type RepoSignals = {
  repo: string;
  description: string;
  languages: string[];
  topics: string[];
  files: string[];
  dependencies: Array<{ name: string; file: string }>;
  readme: string;
  pushed_at: string;
};

export type GithubScan = {
  username: string;
  repos: RepoSignals[];
  activity: {
    public_repos: number;
    scanned_repos: number;
    last_push: string | null;
    active_months: number;
  };
};
