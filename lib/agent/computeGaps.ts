import { SCORING } from '@/lib/config';
import { assessSkills, computeReadinessScore, rankGaps } from '@/lib/scoring';
import type { EvidenceInput, ScoreBreakdown, SkillAssessment } from '@/lib/scoring';
import type { RoleStats } from '@/types/data';
import type { ObservedSource } from '@/types/domain';

export type GapInput = {
  role: RoleStats;
  /** Canonical skill to the resume phrase that claimed it. */
  claimed: Map<string, string>;
  observed: Map<string, ObservedSource[]>;
  /** Canonical skill to quiz score, 0 to 1. */
  verified: Map<string, number>;
  scanned_repos: number;
  github_available: boolean;
};

export type GapAnalysis = {
  assessments: SkillAssessment[];
  gaps: SkillAssessment[];
  score: ScoreBreakdown;
};

/**
 * Merges every evidence source into one scored view of the student. Entirely
 * deterministic: the same inputs always produce the same score and the same gap
 * order, which is what makes the readiness number defensible.
 */
export function computeGaps(input: GapInput): GapAnalysis {
  const evidence = mergeEvidence(input);
  const assessments = assessSkills({
    role: input.role,
    evidence,
    scanned_repos: input.scanned_repos,
    github_available: input.github_available,
  });

  const proficiency = new Map(assessments.map((a) => [a.skill, a.proficiency]));

  return {
    assessments,
    gaps: rankGaps(assessments),
    score: computeReadinessScore(input.role.skills, proficiency),
  };
}

export function topGaps(gaps: SkillAssessment[], count = SCORING.topGapCount): SkillAssessment[] {
  return gaps.slice(0, count);
}

function mergeEvidence(input: GapInput): EvidenceInput[] {
  const skills = new Set<string>([
    ...input.role.skills.map((skill) => skill.skill),
    ...input.claimed.keys(),
    ...input.observed.keys(),
    ...input.verified.keys(),
  ]);

  return [...skills].map((skill) => ({
    skill,
    claimed: input.claimed.has(skill),
    observed: input.observed.has(skill),
    observed_sources: input.observed.get(skill) ?? [],
    verified_score: input.verified.get(skill) ?? null,
  }));
}
