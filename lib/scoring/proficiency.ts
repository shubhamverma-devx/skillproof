import { PROFICIENCY_BY_EVIDENCE, SCORING } from '@/lib/config';
import type { EvidenceLevel } from '@/types/domain';
import type { EvidenceInput } from './types';

/**
 * Proficiency for one skill. A quiz result always wins, because it is the only
 * evidence the student produced under observation. Everything else is a fixed
 * rate for the evidence combination, so two students with the same evidence
 * always get the same number.
 */
export function computeProficiency(evidence: EvidenceInput): number {
  if (evidence.verified_score !== null) return clamp01(evidence.verified_score);
  if (evidence.observed && evidence.claimed) return PROFICIENCY_BY_EVIDENCE.observedAndClaimed;
  if (evidence.observed) return PROFICIENCY_BY_EVIDENCE.observedOnly;
  if (evidence.claimed) return PROFICIENCY_BY_EVIDENCE.claimedOnly;
  return PROFICIENCY_BY_EVIDENCE.none;
}

/**
 * The badge shown against a skill. A quiz taken and failed does not earn the
 * verified badge: it falls back to what the code and resume show, which keeps
 * the badge meaning "proven" rather than "attempted".
 */
export function evidenceLevel(evidence: EvidenceInput): EvidenceLevel {
  if (evidence.verified_score !== null && evidence.verified_score >= SCORING.verifiedThreshold) {
    return 'verified';
  }
  if (evidence.observed) return 'observed';
  if (evidence.claimed) return 'claimed';
  return 'missing';
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
