import { getStore } from '@/lib/db';
import { getRoleStats } from '@/lib/dataset';
import { isRoleSlug } from '@/types/data';
import { computeGaps } from './computeGaps';
import { toEvidenceRows } from './analyze';
import { verifiedScoresFor } from './quiz-history';
import type { Tracer } from './trace';

export type RescoreResult = {
  score: number;
  previous: number | null;
  delta: number | null;
};

/**
 * Recomputes the readiness score from stored evidence and the latest quiz
 * results, then records the new value with the reason that caused it. Resume and
 * GitHub are not read again: an evidence change arrives through its own event.
 */
export async function recomputeAndRecord(
  profileId: string,
  reason: string,
  tracer?: Tracer,
): Promise<RescoreResult> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  if (!isRoleSlug(profile.target_role)) throw new Error('Unknown target role');

  const role = getRoleStats(profile.target_role);
  const stored = await store.listSkillEvidence(profileId);
  const verified = await verifiedScoresFor(profileId);

  const claimed = new Map<string, string>();
  const observed = new Map<string, (typeof stored)[number]['observed_sources']>();
  for (const row of stored) {
    if (row.claimed) claimed.set(row.skill, 'Listed on the resume');
    if (row.observed) observed.set(row.skill, row.observed_sources);
  }

  const analysis = computeGaps({
    role,
    claimed,
    observed,
    verified,
    scanned_repos: profile.github_summary?.scanned_repos ?? 0,
    github_available: profile.github_summary !== null,
  });

  await store.replaceSkillEvidence(profileId, toEvidenceRows(analysis.assessments));

  const history = await store.listScores(profileId);
  const previous = history.at(-1)?.score ?? null;
  await store.addScore(profileId, analysis.score.score, reason);

  const delta = previous === null ? null : Math.round((analysis.score.score - previous) * 10) / 10;
  await tracer?.info(
    'Readiness recalculated',
    `${analysis.score.score} out of 100${delta === null ? '' : ` (${delta >= 0 ? '+' : ''}${delta})`}. ${reason}`,
  );

  return { score: analysis.score.score, previous, delta };
}
