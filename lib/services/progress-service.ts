import { buildRoadmap } from '@/lib/agent/buildRoadmap';
import { recomputeAndRecord } from '@/lib/agent/rescore';
import { Tracer } from '@/lib/agent/trace';
import { WEEKLY_HOURS } from '@/lib/config';
import { getStore } from '@/lib/db';
import { getDemoProgressRepo } from '@/lib/demo';
import { GithubError } from '@/lib/github/client';
import { parseRepoReference, scanSingleRepo } from '@/lib/github/scan';
import type { RepoSignals } from '@/lib/github/types';
import { detectSkillsFromRepo } from '@/lib/skills/detect';
import { describeScoreChange } from '@/lib/roadmap/diff';
import type { ProgressEvent, ProgressResult } from '@/types/api';
import type { RoadmapItemStatus } from '@/types/domain';

/**
 * The single place progress is recorded. Every event applies its own change,
 * then the readiness score is recalculated and the roadmap is replanned around
 * whatever the student has already finished or edited.
 */
export async function recordProgress(
  profileId: string,
  event: ProgressEvent,
): Promise<ProgressResult> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const tracer = new Tracer(profileId);
  const reason = await applyEvent(profileId, event, tracer);
  const rescored = await recomputeAndRecord(profileId, reason, tracer);

  const existing = await store.getLatestRoadmap(profileId);
  let changes: string[] = [];
  let version: number | null = existing?.version ?? null;

  if (existing) {
    const rebuilt = await buildRoadmap(profileId, reason);
    changes = rebuilt.changes;
    version = rebuilt.roadmap.version;
  }

  return {
    score: rescored.score,
    delta: rescored.delta,
    summary: describeScoreChange(rescored.previous, rescored.score),
    changes,
    roadmap_version: version,
    reason,
  };
}

async function applyEvent(
  profileId: string,
  event: ProgressEvent,
  tracer: Tracer,
): Promise<string> {
  switch (event.type) {
    case 'item_status':
      return applyItemStatus(profileId, event.item_id, event.status, tracer);
    case 'repo':
      return applyRepo(profileId, event.repo, tracer);
    case 'weekly_hours':
      return applyWeeklyHours(profileId, event.weekly_hours, tracer);
  }
}

async function applyItemStatus(
  profileId: string,
  itemId: string,
  status: RoadmapItemStatus,
  tracer: Tracer,
): Promise<string> {
  const store = getStore();
  const item = await store.getRoadmapItem(itemId);
  if (!item) throw new Error('Roadmap item not found');

  await store.updateRoadmapItem(itemId, { status, user_edited: true });
  await tracer.info('Roadmap item updated', `${item.title} is now ${status}`);

  if (status === 'done') {
    await tracer.info(
      'Evidence still required',
      `Marking ${item.skill} done does not change your score on its own. Link the proof project repository or take the quiz to turn it into evidence.`,
    );
  }

  return `Marked "${item.title}" as ${status}`;
}

async function applyRepo(profileId: string, input: string, tracer: Tracer): Promise<string> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const signals = await loadRepoSignals(profile.is_demo, input, tracer);
  const detected = detectSkillsFromRepo(signals);
  const existing = await store.listSkillEvidence(profileId);
  const bySkill = new Map(existing.map((row) => [row.skill, row]));

  let added = 0;
  for (const { skill, sources } of detected) {
    const row = bySkill.get(skill);
    if (row?.observed) continue;
    added += 1;
    bySkill.set(skill, {
      id: row?.id ?? '',
      profile_id: profileId,
      skill,
      claimed: row?.claimed ?? false,
      observed: true,
      observed_sources: [...(row?.observed_sources ?? []), ...sources],
      verified_score: row?.verified_score ?? null,
      proficiency: row?.proficiency ?? 0,
      updated_at: new Date().toISOString(),
    });
  }

  await store.replaceSkillEvidence(
    profileId,
    [...bySkill.values()].map((row) => ({
      skill: row.skill,
      claimed: row.claimed,
      observed: row.observed,
      observed_sources: row.observed_sources,
      verified_score: row.verified_score,
      proficiency: row.proficiency,
    })),
  );

  if (profile.github_summary) {
    await store.updateProfile(profileId, {
      github_summary: {
        ...profile.github_summary,
        scanned_repos: profile.github_summary.scanned_repos + 1,
        repos: [
          ...profile.github_summary.repos,
          {
            name: signals.repo,
            pushed_at: signals.pushed_at,
            primary_language: signals.languages[0] ?? null,
          },
        ],
      },
    });
  }

  await tracer.info(
    'New repository scanned',
    `${signals.repo} added ${added} newly observed ${added === 1 ? 'skill' : 'skills'}`,
  );

  return `Linked the repository ${signals.repo}`;
}

async function loadRepoSignals(
  isDemo: boolean,
  input: string,
  tracer: Tracer,
): Promise<RepoSignals> {
  if (isDemo) {
    const signals = getDemoProgressRepo();
    await tracer.info(
      'Demo repository replayed',
      `${signals.repo} was read from the cached demo scan rather than the GitHub API`,
    );
    return signals;
  }

  const reference = parseRepoReference(input);
  if (!reference) {
    throw new Error('That does not look like a GitHub repository. Use owner/name or the full URL.');
  }

  try {
    return await scanSingleRepo(reference);
  } catch (error) {
    if (error instanceof GithubError && error.kind === 'not_found') {
      throw new Error(`We could not find the repository ${reference}. Check that it is public.`);
    }
    throw error;
  }
}

async function applyWeeklyHours(
  profileId: string,
  weeklyHours: number,
  tracer: Tracer,
): Promise<string> {
  const hours = Math.min(WEEKLY_HOURS.max, Math.max(WEEKLY_HOURS.min, Math.round(weeklyHours)));
  await getStore().updateProfile(profileId, { weekly_hours: hours });
  await tracer.info('Weekly hours changed', `The plan now fits ${hours} hours a week`);
  return `Changed your weekly budget to ${hours} hours`;
}
