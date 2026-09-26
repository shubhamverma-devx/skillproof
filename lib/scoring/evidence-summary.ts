import { formatPercent } from '@/lib/utils';
import type { EvidenceInput } from './types';

export type SummaryContext = {
  role: string;
  frequency: number;
  scanned_repos: number;
  github_available: boolean;
};

/**
 * The explainability backbone. Built from counted evidence only, never from a
 * model, so the sentence under every skill and every roadmap item can be traced
 * back to a dataset row or a scanned file. The model is allowed to rewrite the
 * roadmap "why" on top of this, never to replace it.
 */
export function buildEvidenceSummary(evidence: EvidenceInput, context: SummaryContext): string {
  const parts: string[] = [];

  parts.push(
    context.frequency > 0
      ? `${evidence.skill} appears in ${formatPercent(context.frequency)} of ${context.role} job descriptions in our dataset`
      : `${evidence.skill} is not part of the ${context.role} skill list in our dataset`,
  );

  parts.push(codeEvidence(evidence, context));
  parts.push(evidence.claimed ? 'claimed on your resume' : 'not claimed on your resume');

  if (evidence.verified_score !== null) {
    parts.push(`quiz score ${formatPercent(evidence.verified_score)}`);
  }

  return `${parts.join('; ')}.`;
}

function codeEvidence(evidence: EvidenceInput, context: SummaryContext): string {
  if (!context.github_available) return 'no GitHub scan available for this profile';

  if (!evidence.observed) {
    return `not found in any of your ${context.scanned_repos} scanned ${
      context.scanned_repos === 1 ? 'repository' : 'repositories'
    }`;
  }

  const repos = [...new Set(evidence.observed_sources.map((source) => source.repo))];
  const first = evidence.observed_sources[0];
  const where = first ? `${first.file} in ${first.repo}` : repos.join(', ');
  const extra = repos.length > 1 ? ` and ${repos.length - 1} more` : '';
  return `found in your code (${where}${extra})`;
}
