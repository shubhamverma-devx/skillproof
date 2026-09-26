import { QUIZ } from '@/lib/config';
import { getStore } from '@/lib/db';
import { getRoleStats } from '@/lib/dataset';
import { computeReadinessScore, rankGaps, type SkillAssessment } from '@/lib/scoring';
import { assessSkills } from '@/lib/scoring';
import { isRoleSlug } from '@/types/data';
import type { ProfileState, RoadmapView } from '@/types/api';
import type { Profile, SkillEvidence } from '@/types/domain';

/**
 * Rebuilds the whole view of a profile from stored rows. Scores are recomputed
 * rather than read back, so a dataset change is reflected everywhere at once and
 * there is no second copy of the score to drift.
 */
export async function loadProfileState(profileId: string): Promise<ProfileState | null> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) return null;
  if (!isRoleSlug(profile.target_role)) throw new Error('Unknown target role');

  const role = getRoleStats(profile.target_role);
  const evidence = await store.listSkillEvidence(profileId);
  const assessments = assessSkills({
    role,
    evidence: evidence.map(toEvidenceInput),
    scanned_repos: profile.github_summary?.scanned_repos ?? 0,
    github_available: profile.github_summary !== null,
  });

  const gaps = rankGaps(assessments);
  const score = computeReadinessScore(
    role.skills,
    new Map(assessments.map((a) => [a.skill, a.proficiency])),
  );

  const [history, logs, roadmap] = await Promise.all([
    store.listScores(profileId),
    store.listLogs(profileId),
    loadLatestRoadmap(profileId),
  ]);

  return {
    profile,
    role: {
      slug: profile.target_role,
      name: role.role,
      jd_count: role.jd_count,
      source_note: role.source_note,
    },
    score: score.score,
    assessments,
    gaps,
    quiz_candidates: pickQuizCandidates(assessments),
    roadmap,
    history,
    logs,
    github: githubState(profile),
    demo: profile.is_demo,
  };
}

async function loadLatestRoadmap(profileId: string): Promise<RoadmapView | null> {
  const store = getStore();
  const roadmap = await store.getLatestRoadmap(profileId);
  if (!roadmap) return null;
  return { roadmap, items: await store.listRoadmapItems(roadmap.id), changes: [] };
}

function githubState(profile: Profile): ProfileState['github'] {
  return {
    username: profile.github_username,
    scanned_repos: profile.github_summary?.scanned_repos ?? 0,
    available: profile.github_summary !== null,
  };
}

function toEvidenceInput(row: SkillEvidence) {
  return {
    skill: row.skill,
    claimed: row.claimed,
    observed: row.observed,
    observed_sources: row.observed_sources,
    verified_score: row.verified_score,
  };
}

/**
 * Skills worth offering for verification: the student already claims or shows
 * them, the role cares about them, and no quiz has been taken yet. Skills with no
 * evidence belong in the roadmap, not in a quiz.
 */
function pickQuizCandidates(assessments: SkillAssessment[]): string[] {
  return assessments
    .filter(
      (assessment) =>
        assessment.frequency > 0 &&
        !assessment.tested &&
        (assessment.claimed || assessment.observed),
    )
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, QUIZ.offeredSkillCount)
    .map((assessment) => assessment.skill);
}
