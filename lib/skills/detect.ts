import { getTaxonomy } from '@/lib/dataset';
import type { RepoSignals } from '@/lib/github/types';
import type { ObservedSource } from '@/types/domain';
import { findSkillsInText, tokenise } from './taxonomy';

export type DetectedSkill = { skill: string; sources: ObservedSource[] };

/**
 * Reads dependency names out of a manifest. Versions, extras and comments are
 * dropped so the result can be compared against taxonomy package hints.
 */
export function parseDependencies(file: string, content: string): string[] {
  if (file === 'package.json') return parsePackageJson(content);
  if (file === 'requirements.txt') return parseRequirements(content);
  if (file === 'pyproject.toml' || file === 'Pipfile') return parseTomlLike(content);
  return [];
}

function parsePackageJson(content: string): string[] {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const record = parsed as Record<string, unknown>;
    const groups = ['dependencies', 'devDependencies', 'peerDependencies'];
    const names = new Set<string>();
    for (const group of groups) {
      const value = record[group];
      if (typeof value === 'object' && value !== null) {
        for (const name of Object.keys(value)) names.add(name.toLowerCase());
      }
    }
    return [...names];
  } catch {
    return [];
  }
}

function parseRequirements(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.split('#')[0]?.trim() ?? '')
    .filter((line) => line.length > 0 && !line.startsWith('-'))
    .map((line) => line.split(/[[<>=!~;\s]/)[0]?.toLowerCase() ?? '')
    .filter((name) => name.length > 0);
}

function parseTomlLike(content: string): string[] {
  const names = new Set<string>();
  for (const rawLine of content.split('\n')) {
    const line = rawLine.split('#')[0]?.trim() ?? '';
    if (!line || line.startsWith('[')) continue;
    // Matches both `torch = "^2.1"` and the `"torch>=2.1",` list form.
    const quoted = line.match(/^["']([A-Za-z0-9._-]+)\s*[<>=!~^]*/);
    const assigned = line.match(/^([A-Za-z0-9._-]+)\s*=/);
    const name = quoted?.[1] ?? assigned?.[1];
    if (name && name !== 'python' && name !== 'version') names.add(name.toLowerCase());
  }
  return [...names];
}

function pathMatchesHint(path: string, hint: string): boolean {
  if (path === hint) return true;
  // Directory hints such as ".github/workflows" or "k8s" match anything inside.
  if (path.startsWith(`${hint}/`)) return true;
  return path.endsWith(`/${hint}`);
}

/**
 * Deterministic evidence extraction for one repository. Every hit records the
 * exact repository and file that proved it, which is what the dashboard shows
 * when a user expands a skill row.
 */
export function detectSkillsFromRepo(signals: RepoSignals): DetectedSkill[] {
  const detected = new Map<string, ObservedSource[]>();
  const add = (skill: string, source: ObservedSource) => {
    const list = detected.get(skill);
    if (list) list.push(source);
    else detected.set(skill, [source]);
  };

  const dependencyIndex = new Map(
    signals.dependencies.map((dependency) => [dependency.name.toLowerCase(), dependency.file]),
  );
  const languageTokens = new Set(signals.languages.map(tokenise));
  const topicTokens = new Set(signals.topics.map(tokenise));

  for (const entry of getTaxonomy().skills) {
    for (const pkg of entry.hints.packages) {
      const file = dependencyIndex.get(pkg.toLowerCase());
      if (file) {
        add(entry.canonical, {
          repo: signals.repo,
          file,
          hint: `${file} lists the dependency ${pkg}`,
        });
      }
    }

    for (const fileHint of entry.hints.files) {
      const match = signals.files.find((path) => pathMatchesHint(path, fileHint));
      if (match) {
        add(entry.canonical, { repo: signals.repo, file: match, hint: `${match} is present` });
      }
    }

    for (const language of entry.hints.languages) {
      if (languageTokens.has(tokenise(language))) {
        add(entry.canonical, {
          repo: signals.repo,
          file: 'GitHub language stats',
          hint: `${language} is one of the repository languages`,
        });
      }
    }

    for (const topic of entry.hints.topics) {
      if (topicTokens.has(tokenise(topic))) {
        add(entry.canonical, {
          repo: signals.repo,
          file: 'repository topics',
          hint: `tagged with the topic ${topic}`,
        });
      }
    }
  }

  // A tool proves the concept behind it. Using PyTorch is deep learning work
  // whether or not the README happens to say the words.
  for (const entry of getTaxonomy().skills) {
    const sources = detected.get(entry.canonical);
    const first = sources?.[0];
    if (!first) continue;
    for (const implied of entry.implies) {
      if (detected.has(implied)) continue;
      add(implied, {
        repo: signals.repo,
        file: first.file,
        hint: `${entry.canonical} in ${first.file} is ${implied.toLowerCase()} work`,
      });
    }
  }

  // Concepts leave no dependency behind, so for those only the README can show
  // intent. Applying this to every skill would let a mention pass as code.
  const readmeSkills = findSkillsInText(`${signals.readme}\n${signals.description}`);
  for (const skill of readmeSkills) {
    const entry = getTaxonomy().skills.find((candidate) => candidate.canonical === skill);
    if (entry?.category !== 'concept' || detected.has(skill)) continue;
    add(skill, {
      repo: signals.repo,
      file: 'README.md',
      hint: `README describes ${skill}`,
    });
  }

  return [...detected.entries()].map(([skill, sources]) => ({ skill, sources }));
}

/** Merges per repository detections into one list of sources per skill. */
export function mergeDetections(all: DetectedSkill[][]): Map<string, ObservedSource[]> {
  const merged = new Map<string, ObservedSource[]>();
  for (const perRepo of all) {
    for (const { skill, sources } of perRepo) {
      const existing = merged.get(skill);
      if (existing) existing.push(...sources);
      else merged.set(skill, [...sources]);
    }
  }
  return merged;
}
