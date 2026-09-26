import { ROADMAP } from '@/lib/config';
import { getResources } from '@/lib/dataset';
import type { SkillAssessment } from '@/lib/scoring';
import { formatPercent } from '@/lib/utils';
import { estimateHours } from './plan';
import type { PlanContext } from './types';

export const ROADMAP_SYSTEM_PROMPT = [
  'You sequence a learning roadmap for one student and return JSON only.',
  'You are given the gaps, already ranked, with the evidence behind each one.',
  'Rules you must follow:',
  '1. Only plan skills from the given gap list. Never add a skill that is not listed.',
  '2. Respect prerequisite order: a skill must come after anything it depends on that is also in the list.',
  '3. The sum of est_hours in any one week must not exceed the weekly hour budget.',
  '4. why must cite the given job description percentage and the given evidence for that skill. Generic motivation is rejected.',
  '5. resource_urls must be copied exactly from the allowed resources given for that skill. Never write a URL that is not in the list.',
  '6. proof_project should combine two or three gap skills where that is natural, with three to five acceptance criteria that can be checked by looking at a repository.',
  'Write plain sentences. No marketing language, no emoji, no em dashes.',
].join('\n');

/** The whole planning brief, including the evidence that makes each why checkable. */
export function buildRoadmapPrompt(gaps: SkillAssessment[], context: PlanContext): string {
  const lines = gaps.map((gap, index) => {
    const resources = getResources(gap.skill)
      .map((resource) => `      ${resource.url} (${resource.title})`)
      .join('\n');

    return [
      `${index + 1}. ${gap.skill}`,
      `   job description demand: ${formatPercent(gap.frequency)}`,
      `   current evidence: ${gap.evidence_summary}`,
      `   suggested hours: ${estimateHours(gap)}`,
      `   allowed resources:\n${resources || '      none'}`,
    ].join('\n');
  });

  return [
    `Target role: ${context.role}`,
    `Weekly hour budget: ${context.weekly_hours}`,
    `Planning horizon: ${ROADMAP.defaultWeeks} weeks`,
    `Hours still free in that horizon: ${context.available_hours}`,
    '',
    'Gaps, already ordered by how much readiness they cost:',
    lines.join('\n\n'),
    '',
    'Return JSON shaped as { "items": [ { "week", "skill", "title", "why", "est_hours", "resource_urls", "proof_project" } ] }.',
  ].join('\n');
}
