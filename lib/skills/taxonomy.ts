import { getTaxonomy } from '@/lib/dataset';
import type { TaxonomyEntry } from '@/types/data';
import type { SkillCategory } from '@/types/domain';

type Lookup = {
  byToken: Map<string, string>;
  byCanonical: Map<string, TaxonomyEntry>;
};

let lookup: Lookup | null = null;

/**
 * Lowercase and reduce to space separated words so "Node.JS" and "node js" meet.
 * Every separator becomes a space rather than being deleted: dropping newlines
 * would glue "- Git" onto the previous line and hide the match. Hyphens survive
 * because they are part of names like scikit-learn.
 */
export function tokenise(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[._/\\+#]/g, ' ')
    .replace(/[^a-z0-9-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLookup(): Lookup {
  if (lookup) return lookup;
  const byToken = new Map<string, string>();
  const byCanonical = new Map<string, TaxonomyEntry>();

  for (const entry of getTaxonomy().skills) {
    byCanonical.set(entry.canonical, entry);
    for (const name of [entry.canonical, ...entry.aliases]) {
      const token = tokenise(name);
      // First writer wins: canonical names are registered before aliases, so an
      // alias can never shadow a real skill name.
      if (!byToken.has(token)) byToken.set(token, entry.canonical);
    }
  }

  lookup = { byToken, byCanonical };
  return lookup;
}

/** Maps any spelling of a skill onto its canonical name, or null if unknown. */
export function normaliseSkillName(raw: string): string | null {
  if (!raw.trim()) return null;
  return getLookup().byToken.get(tokenise(raw)) ?? null;
}

function getSkillEntry(canonical: string): TaxonomyEntry | null {
  return getLookup().byCanonical.get(canonical) ?? null;
}

export function getSkillCategory(canonical: string): SkillCategory {
  return getSkillEntry(canonical)?.category ?? 'concept';
}

/** Stable file and query friendly identifier, matching data/question_bank names. */
export function skillSlug(skill: string): string {
  return tokenise(skill).replace(/ /g, '-');
}

type TokenEntry = { token: string; canonical: string };

let orderedTokens: TokenEntry[] | null = null;

/** Longest first, so "node js" is matched before the "js" alias inside it. */
function getOrderedTokens(): TokenEntry[] {
  if (orderedTokens) return orderedTokens;
  const entries: TokenEntry[] = [];
  for (const entry of getTaxonomy().skills) {
    for (const name of [entry.canonical, ...entry.aliases]) {
      const token = tokenise(name);
      if (token.length >= 2) entries.push({ token, canonical: entry.canonical });
    }
  }
  entries.sort((a, b) => b.token.length - a.token.length || a.token.localeCompare(b.token));
  orderedTokens = entries;
  return entries;
}

/**
 * Finds known skills mentioned in free text. Matching is on whole words and each
 * matched span is consumed, so "Node.js" does not also register JavaScript
 * through its "js" alias and "GitHub Actions" does not also register Git.
 */
export function findSkillsInText(text: string): string[] {
  const haystack = ` ${tokenise(text)} `;
  const claimedSpans = new Uint8Array(haystack.length);
  const found = new Set<string>();

  for (const { token, canonical } of getOrderedTokens()) {
    const needle = ` ${token} `;
    let from = 0;

    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      const start = at + 1;
      const end = start + token.length;
      let free = true;
      for (let index = start; index < end; index += 1) {
        if (claimedSpans[index]) {
          free = false;
          break;
        }
      }
      if (free) {
        found.add(canonical);
        claimedSpans.fill(1, start, end);
      }
      from = at + 1;
    }
  }

  return [...found];
}
