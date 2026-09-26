import type { RoleSkill } from '@/types/data';
import type { ScoreBreakdown, SkillAssessment } from './types';

/**
 * Readiness is the JD weighted share of role skills the student can prove:
 *
 *   score = 100 * sum(frequency_i * proficiency_i) / sum(frequency_i)
 *
 * Weighting by frequency means a gap in a skill 90% of listings ask for costs
 * far more than a gap in a skill 15% ask for. Skills outside the role carry a
 * frequency of 0 and therefore never move the score.
 */
export function computeReadinessScore(
  roleSkills: RoleSkill[],
  proficiencyBySkill: Map<string, number>,
): ScoreBreakdown {
  let covered = 0;
  let total = 0;

  for (const { skill, frequency } of roleSkills) {
    total += frequency;
    covered += frequency * (proficiencyBySkill.get(skill) ?? 0);
  }

  if (total === 0) return { score: 0, covered_weight: 0, total_weight: 0 };

  return {
    score: round1((100 * covered) / total),
    covered_weight: round3(covered),
    total_weight: round3(total),
  };
}

/**
 * The score this profile could reach by proving what it already shows, without
 * learning anything new. Every skill with some evidence behind it is counted at
 * full proficiency; skills with no evidence at all stay at zero, because those
 * need work rather than proof.
 *
 * It answers the question the readiness score raises: how much of the gap is
 * "I have not shown this yet" against "I cannot do this yet".
 */
export function maxReachableScore(roleSkills: RoleSkill[], assessments: SkillAssessment[]): number {
  const evidenced = new Set(
    assessments
      .filter((assessment) => assessment.claimed || assessment.observed || assessment.tested)
      .map((assessment) => assessment.skill),
  );

  let reachable = 0;
  let total = 0;

  for (const { skill, frequency } of roleSkills) {
    total += frequency;
    if (evidenced.has(skill)) reachable += frequency;
  }

  if (total === 0) return 0;
  return round1((100 * reachable) / total);
}

/** Gaps ordered by how much readiness they cost, largest first. */
export function rankGaps(assessments: SkillAssessment[]): SkillAssessment[] {
  return [...assessments]
    .filter((assessment) => assessment.frequency > 0 && assessment.gap_weight > 0)
    .sort((a, b) => b.gap_weight - a.gap_weight || b.frequency - a.frequency);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
