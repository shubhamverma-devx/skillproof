import { ROADMAP } from '@/lib/config';
import { getProofBlueprint, getResources } from '@/lib/dataset';
import type { SkillAssessment } from '@/lib/scoring';
import { normaliseSkillName } from '@/lib/skills/taxonomy';
import type { LearningResource, ProofProject } from '@/types/domain';
import { packIntoWeeks } from './hours';
import { buildWhy } from './plan';
import type { PlanDraft, PlanItemDraft } from './schema';
import type { PlanContext, PlannedItem } from './types';

export class EmptyPlanError extends Error {
  constructor() {
    super('The model returned no usable roadmap items.');
    this.name = 'EmptyPlanError';
  }
}

export type ValidationReport = {
  items: PlannedItem[];
  dropped_urls: number;
  dropped_items: number;
  rescheduled: boolean;
};

/**
 * Turns model output into roadmap items that satisfy the product's own rules.
 * Anything the model got wrong is corrected here rather than trusted: unknown
 * skills are dropped, invented URLs are removed, and the week plan is repacked
 * to fit the student's hour budget.
 */
export function validatePlan(
  draft: PlanDraft,
  gaps: SkillAssessment[],
  context: PlanContext,
): ValidationReport {
  const gapBySkill = new Map(gaps.map((gap) => [gap.skill, gap]));
  const rankBySkill = new Map(gaps.map((gap, index) => [gap.skill, index + 1]));
  const seen = new Set<string>();

  let droppedUrls = 0;
  let droppedItems = 0;

  const drafts = [...draft.items]
    .sort((a, b) => a.week - b.week)
    .flatMap((item) => {
      const skill = normaliseSkillName(item.skill);
      const gap = skill ? gapBySkill.get(skill) : undefined;
      if (!skill || !gap || seen.has(skill)) {
        droppedItems += 1;
        return [];
      }
      seen.add(skill);

      const { resources, dropped } = whitelistResources(skill, item.resource_urls);
      droppedUrls += dropped;

      return [
        {
          skill,
          title: item.title.trim(),
          why: item.why.trim() || buildWhy(gap, rankBySkill.get(skill) ?? 1, context),
          evidence_summary: gap.evidence_summary,
          jd_frequency: gap.frequency,
          est_hours: clampHours(item.est_hours),
          resources,
          proof_project: repairProofProject(item, skill, gapBySkill),
        },
      ];
    });

  if (drafts.length === 0) throw new EmptyPlanError();

  const beforeWeeks = draft.items.map((item) => item.week);
  const items = packIntoWeeks(drafts, context.weekly_hours);
  const rescheduled = items.some((item, index) => item.week !== beforeWeeks[index]);

  return { items, dropped_urls: droppedUrls, dropped_items: droppedItems, rescheduled };
}

function clampHours(hours: number): number {
  return Math.min(ROADMAP.maxItemHours, Math.max(ROADMAP.minItemHours, Math.round(hours)));
}

/**
 * Keeps only URLs that exist in data/resources.json for that skill. A skill left
 * with nothing falls back to its curated list, so an item is never resourceless.
 */
export function whitelistResources(
  skill: string,
  urls: string[],
): { resources: LearningResource[]; dropped: number } {
  const allowed = getResources(skill);
  const byUrl = new Map(allowed.map((resource) => [resource.url, resource]));

  const kept: LearningResource[] = [];
  let dropped = 0;

  for (const url of urls) {
    const match = byUrl.get(url.trim());
    if (match && !kept.includes(match)) kept.push(match);
    else dropped += 1;
  }

  return { resources: kept.length > 0 ? kept.slice(0, 3) : allowed.slice(0, 2), dropped };
}

function repairProofProject(
  item: PlanItemDraft,
  skill: string,
  gapBySkill: Map<string, SkillAssessment>,
): ProofProject | null {
  const blueprint = getProofBlueprint(skill);
  const proposed = item.proof_project;

  if (!proposed) {
    return blueprint
      ? {
          title: blueprint.title,
          description: blueprint.description,
          skills_covered: [skill],
          acceptance_criteria: blueprint.acceptance_criteria,
        }
      : null;
  }

  const covered = [
    skill,
    ...proposed.skills_covered
      .map((name) => normaliseSkillName(name))
      .filter((name): name is string => name !== null && name !== skill && gapBySkill.has(name)),
  ].slice(0, 3);

  const criteria = [...proposed.acceptance_criteria];
  while (criteria.length < 3 && blueprint) {
    const extra = blueprint.acceptance_criteria[criteria.length];
    if (!extra || criteria.includes(extra)) break;
    criteria.push(extra);
  }

  return {
    title: proposed.title,
    description: proposed.description,
    skills_covered: covered,
    acceptance_criteria: criteria.slice(0, 5),
  };
}
