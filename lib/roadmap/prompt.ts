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
  '6. proof_project must be an object, never a string. Combine two or three gap skills where that is natural.',
  'Write plain sentences. No marketing language, no emoji, no em dashes.',
  '',
  'Return exactly this shape:',
  JSON.stringify(
    {
      items: [
        {
          week: 1,
          skill: 'Docker',
          title: 'Containerise the crop yield model',
          why: 'Docker appears in 46% of ML Engineer job descriptions and was not found in any of your 9 repositories.',
          est_hours: 6,
          resource_urls: ['https://docs.docker.com/get-started/'],
          proof_project: {
            title: 'Containerise one of your existing projects',
            description:
              'Make a project that runs only on your laptop start with one command anywhere.',
            skills_covered: ['Docker', 'Model deployment'],
            acceptance_criteria: [
              'A Dockerfile builds the project with no manual steps',
              'The image runs with a single docker run command',
              'The README records the final image size',
            ],
          },
        },
      ],
    },
    null,
    2,
  ),
].join('\n');

/**
 * The planning brief. Only the gaps that can actually fit the horizon are sent,
 * and resources are listed as bare URLs, because the free tier with the tightest
 * budget in the chain allows 8000 tokens a minute for prompt and reply together.
 */
export function buildRoadmapPrompt(gaps: SkillAssessment[], context: PlanContext): string {
  const lines = gaps.map((gap, index) => {
    const resources = getResources(gap.skill)
      .map((resource) => resource.url)
      .join(' ');

    return [
      `${index + 1}. ${gap.skill} | demand ${formatPercent(gap.frequency)} | suggested hours ${estimateHours(gap)}`,
      `   evidence: ${gap.evidence_summary}`,
      `   allowed resource urls: ${resources || 'none'}`,
    ].join('\n');
  });

  return [
    `Target role: ${context.role}`,
    `Weekly hour budget: ${context.weekly_hours}`,
    `Planning horizon: ${ROADMAP.defaultWeeks} weeks, ${context.available_hours} hours still free`,
    '',
    'Gaps, already ordered by how much readiness they cost:',
    lines.join('\n'),
  ].join('\n');
}
