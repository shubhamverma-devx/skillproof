import type { EvidenceLevel } from '@/types/domain';

/**
 * The single place internal names become the words a student reads. The code
 * keeps claimed, observed and verified; the interface never shows them.
 */
export const PROOF_LABEL: Record<EvidenceLevel, string> = {
  verified: 'Tested',
  observed: 'Seen in your code',
  claimed: 'On your resume',
  missing: 'Not shown yet',
};

export const PROOF_MEANING: Record<EvidenceLevel, string> = {
  verified: 'You answered questions on this and got them right.',
  observed: 'We found this in your public code, in a specific file.',
  claimed: 'Your resume lists this, but we have not seen it anywhere else.',
  missing: 'Nothing on your resume or in your code mentions this.',
};

export const PROOF_ORDER: EvidenceLevel[] = ['verified', 'observed', 'claimed', 'missing'];

/** "Asked in 62% of jobs", the phrase that replaces job description frequency. */
export function demandPhrase(frequency: number): string {
  return `Asked in ${Math.round(frequency * 100)}% of jobs`;
}

export function shortDemand(frequency: number): string {
  return `${Math.round(frequency * 100)}% of jobs`;
}

/** One sentence under the score saying what the number means for this student. */
export function readinessMeaning(score: number, ceiling: number, roleName: string): string {
  const headroom = Math.round(ceiling - score);

  if (headroom >= 20) {
    return `Most of your gap is unproven, not unknown. You could reach ${Math.round(ceiling)} by proving skills you already have.`;
  }
  if (headroom >= 5) {
    return `Proving what you already show would take you to ${Math.round(ceiling)}. After that, the rest needs new skills.`;
  }
  return `You have proven almost everything you can show. The rest needs new skills for ${roleName} work.`;
}

export function scoreHeadline(score: number, roleName: string): string {
  return `You are ${Math.round(score)}% ready for ${roleName} roles.`;
}
