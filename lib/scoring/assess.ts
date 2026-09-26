import { getSkillCategory } from '@/lib/skills/taxonomy';
import type { RoleStats } from '@/types/data';
import { buildEvidenceSummary } from './evidence-summary';
import { computeProficiency, evidenceLevel } from './proficiency';
import type { EvidenceInput, SkillAssessment } from './types';

export type AssessInput = {
  role: RoleStats;
  evidence: EvidenceInput[];
  scanned_repos: number;
  github_available: boolean;
};

/**
 * Scores every skill once: role skills so the readiness score has a denominator,
 * plus any extra skill the student can prove, which is shown separately as
 * transferable evidence rather than silently dropped.
 */
export function assessSkills(input: AssessInput): SkillAssessment[] {
  const frequencies = new Map(input.role.skills.map((skill) => [skill.skill, skill.frequency]));
  const bySkill = new Map(input.evidence.map((row) => [row.skill, row]));

  const skills = new Set<string>([...frequencies.keys(), ...bySkill.keys()]);

  return [...skills]
    .map((skill) => {
      const evidence: EvidenceInput = bySkill.get(skill) ?? {
        skill,
        claimed: false,
        observed: false,
        observed_sources: [],
        verified_score: null,
      };
      const frequency = frequencies.get(skill) ?? 0;
      const proficiency = computeProficiency(evidence);

      return {
        ...evidence,
        category: getSkillCategory(skill),
        frequency,
        proficiency,
        level: evidenceLevel(evidence),
        tested: evidence.verified_score !== null,
        gap_weight: round3(frequency * (1 - proficiency)),
        evidence_summary: buildEvidenceSummary(evidence, {
          role: input.role.role,
          frequency,
          scanned_repos: input.scanned_repos,
          github_available: input.github_available,
        }),
      };
    })
    .sort((a, b) => b.frequency - a.frequency || a.skill.localeCompare(b.skill));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
