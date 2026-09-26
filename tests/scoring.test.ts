import { describe, expect, it } from 'vitest';
import { PROFICIENCY_BY_EVIDENCE, SCORING } from '@/lib/config';
import { computeProficiency, computeReadinessScore, evidenceLevel, rankGaps } from '@/lib/scoring';
import type { EvidenceInput, SkillAssessment } from '@/lib/scoring';

function evidence(partial: Partial<EvidenceInput> = {}): EvidenceInput {
  return {
    skill: 'Docker',
    claimed: false,
    observed: false,
    observed_sources: [],
    verified_score: null,
    ...partial,
  };
}

function assessment(partial: Partial<SkillAssessment>): SkillAssessment {
  return {
    ...evidence(),
    category: 'tool',
    frequency: 0.5,
    proficiency: 0,
    level: 'missing',
    tested: false,
    gap_weight: 0.5,
    evidence_summary: '',
    ...partial,
  };
}

describe('computeProficiency', () => {
  it('prefers a quiz score over every other signal', () => {
    expect(computeProficiency(evidence({ claimed: true, observed: true, verified_score: 0.25 }))).toBe(
      0.25,
    );
  });

  it('rates code plus resume above code alone', () => {
    expect(computeProficiency(evidence({ claimed: true, observed: true }))).toBe(
      PROFICIENCY_BY_EVIDENCE.observedAndClaimed,
    );
    expect(computeProficiency(evidence({ observed: true }))).toBe(
      PROFICIENCY_BY_EVIDENCE.observedOnly,
    );
  });

  it('rates a resume claim lowest and no evidence at zero', () => {
    expect(computeProficiency(evidence({ claimed: true }))).toBe(
      PROFICIENCY_BY_EVIDENCE.claimedOnly,
    );
    expect(computeProficiency(evidence())).toBe(0);
  });

  it('clamps a quiz score that arrives outside 0 to 1', () => {
    expect(computeProficiency(evidence({ verified_score: 1.4 }))).toBe(1);
    expect(computeProficiency(evidence({ verified_score: -0.2 }))).toBe(0);
  });
});

describe('evidenceLevel', () => {
  it('awards the verified badge only at or above the threshold', () => {
    expect(evidenceLevel(evidence({ verified_score: SCORING.verifiedThreshold }))).toBe('verified');
    expect(evidenceLevel(evidence({ verified_score: 0.9 }))).toBe('verified');
  });

  it('falls back to code or resume evidence when a quiz was failed', () => {
    expect(evidenceLevel(evidence({ verified_score: 0.25, observed: true }))).toBe('observed');
    expect(evidenceLevel(evidence({ verified_score: 0.25, claimed: true }))).toBe('claimed');
    expect(evidenceLevel(evidence({ verified_score: 0.25 }))).toBe('missing');
  });
});

describe('computeReadinessScore', () => {
  const roleSkills = [
    { skill: 'Python', frequency: 0.9, category: 'language' as const },
    { skill: 'Docker', frequency: 0.5, category: 'tool' as const },
    { skill: 'SQL', frequency: 0.6, category: 'language' as const },
  ];

  it('weights each skill by how often job descriptions ask for it', () => {
    const result = computeReadinessScore(
      roleSkills,
      new Map([
        ['Python', 1],
        ['Docker', 0],
        ['SQL', 0.5],
      ]),
    );
    // (0.9*1 + 0.5*0 + 0.6*0.5) / 2.0 = 0.6
    expect(result.score).toBe(60);
    expect(result.total_weight).toBe(2);
    expect(result.covered_weight).toBe(1.2);
  });

  it('scores zero with no evidence and 100 when everything is proven', () => {
    expect(computeReadinessScore(roleSkills, new Map()).score).toBe(0);
    expect(
      computeReadinessScore(
        roleSkills,
        new Map(roleSkills.map((skill) => [skill.skill, 1])),
      ).score,
    ).toBe(100);
  });

  it('ignores skills outside the role, so extra skills cannot inflate the score', () => {
    const withExtra = computeReadinessScore(
      roleSkills,
      new Map([
        ['Python', 1],
        ['Figma', 1],
      ]),
    );
    expect(withExtra.score).toBe(45);
  });

  it('returns zero rather than dividing by zero for an empty role', () => {
    expect(computeReadinessScore([], new Map()).score).toBe(0);
  });
});

describe('rankGaps', () => {
  it('orders by readiness cost, not by raw demand', () => {
    const ranked = rankGaps([
      assessment({ skill: 'Python', frequency: 0.9, proficiency: 0.9, gap_weight: 0.09 }),
      assessment({ skill: 'Docker', frequency: 0.5, proficiency: 0, gap_weight: 0.5 }),
      assessment({ skill: 'SQL', frequency: 0.6, proficiency: 0.5, gap_weight: 0.3 }),
    ]);
    expect(ranked.map((gap) => gap.skill)).toEqual(['Docker', 'SQL', 'Python']);
  });

  it('drops fully proven skills and skills the role does not ask for', () => {
    const ranked = rankGaps([
      assessment({ skill: 'Python', proficiency: 1, gap_weight: 0 }),
      assessment({ skill: 'Figma', frequency: 0, gap_weight: 0 }),
    ]);
    expect(ranked).toHaveLength(0);
  });
});
