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
