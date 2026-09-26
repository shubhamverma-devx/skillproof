import type { EvidenceLevel, ObservedSource, SkillCategory } from '@/types/domain';

/** The raw evidence for one skill, before any scoring is applied. */
export type EvidenceInput = {
  skill: string;
  claimed: boolean;
  observed: boolean;
  observed_sources: ObservedSource[];
  verified_score: number | null;
};

/** One scored skill, with everything the dashboard and the planner need. */
export type SkillAssessment = EvidenceInput & {
  category: SkillCategory;
  /** Share of role JDs mentioning this skill; 0 for skills the role never asks for. */
  frequency: number;
  proficiency: number;
  level: EvidenceLevel;
  tested: boolean;
  /** frequency * (1 - proficiency): how much this gap costs the readiness score. */
  gap_weight: number;
  evidence_summary: string;
};

export type ScoreBreakdown = {
  score: number;
  covered_weight: number;
  total_weight: number;
};
