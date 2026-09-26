import { ROADMAP } from '@/lib/config';
import { getProofBlueprint, getResources } from '@/lib/dataset';
import type { SkillAssessment } from '@/lib/scoring';
import type { ProofProject } from '@/types/domain';
import { packIntoWeeks } from './hours';
import { prerequisiteDepth, prerequisitesOf } from './prerequisites';
import type { PlanContext, PlannedItem } from './types';

/**
 * Estimated hours for closing one gap. Scaled by how much of the skill is still
 * unproven, so a skill at 50% proficiency costs less than one at zero.
 */
export function estimateHours(assessment: SkillAssessment): number {
  const unproven = 1 - assessment.proficiency;
  const raw = Math.round(ROADMAP.minItemHours + 8 * unproven);
  return Math.min(ROADMAP.maxItemHours, Math.max(ROADMAP.minItemHours, raw));
}

/** What closing this gap completely is worth on the 0 to 100 readiness scale. */
function scorePointsAvailable(assessment: SkillAssessment, totalWeight: number): number {
  if (totalWeight === 0) return 0;
  return Math.round((100 * assessment.gap_weight) / totalWeight * 10) / 10;
}

/**
 * Picks the gaps that fit the student's time in the planning horizon, largest
 * readiness cost first. Anything that does not fit is returned separately so the
 * UI can say what was left for the next cycle rather than dropping it silently.
 */
function selectGaps(
  gaps: SkillAssessment[],
  availableHours: number,
): { selected: SkillAssessment[]; deferred: SkillAssessment[] } {
  const capacity = Math.max(ROADMAP.minItemHours, availableHours);
  const selected: SkillAssessment[] = [];
  const deferred: SkillAssessment[] = [];
  let planned = 0;

  for (const gap of gaps.slice(0, ROADMAP.maxPlannedSkills)) {
    const hours = estimateHours(gap);
    if (selected.length > 0 && planned + hours > capacity) {
      deferred.push(gap);
      continue;
    }
    selected.push(gap);
    planned += hours;
  }

  return { selected, deferred: [...deferred, ...gaps.slice(ROADMAP.maxPlannedSkills)] };
}

/** Prerequisites first, then readiness cost. Stable for the same inputs. */
function orderForLearning(gaps: SkillAssessment[]): SkillAssessment[] {
  const planned = new Set(gaps.map((gap) => gap.skill));
  return [...gaps].sort((a, b) => {
    const depth = prerequisiteDepth(a.skill, planned) - prerequisiteDepth(b.skill, planned);
    return depth !== 0 ? depth : b.gap_weight - a.gap_weight;
  });
}

export function buildWhy(
  assessment: SkillAssessment,
  rank: number,
  context: PlanContext,
): string {
  const points = scorePointsAvailable(assessment, context.total_weight);
  return [
    `Ranked ${rank} among your ${context.role} gaps by readiness cost.`,
    assessment.evidence_summary,
    `Proving it is worth about ${points} readiness points.`,
  ].join(' ');
}

/**
 * Two gaps belong in one project only when they genuinely meet: same family of
 * skill, or one is a prerequisite of the other. Forcing unrelated skills
 * together produces the kind of project nobody builds.
 */
function canCombine(a: SkillAssessment, b: SkillAssessment): boolean {
  if (a.category === b.category) return true;
  return prerequisitesOf(a.skill).includes(b.skill) || prerequisitesOf(b.skill).includes(a.skill);
}

/**
 * Builds a proof project from the curated blueprint, folding in a second gap
 * skill when one is available so the project covers more than one weakness.
 */
function buildProofProject(skill: string, partner: string | null): ProofProject | null {
  const blueprint = getProofBlueprint(skill);
  if (!blueprint) return null;

  const criteria = [...blueprint.acceptance_criteria];
  if (partner) {
    criteria.push(`${partner} is used in the same project rather than in a separate exercise`);
  }

  return {
    title: blueprint.title,
    description: blueprint.description,
    skills_covered: partner ? [skill, partner] : [skill],
    acceptance_criteria: criteria.slice(0, 5),
  };
}

/**
 * The deterministic planner. It is both the offline path when no model is
 * configured and the fallback when every model call fails, so it has to produce
 * a plan good enough to hand to a student as it is.
 */
export function planRoadmap(gaps: SkillAssessment[], context: PlanContext): PlannedItem[] {
  const { selected } = selectGaps(gaps, context.available_hours);
  const ordered = orderForLearning(selected);
  const rankBySkill = new Map(gaps.map((gap, index) => [gap.skill, index + 1]));

  const drafts = ordered.map((assessment, index) => {
    const partner = pickPartner(ordered, index);
    const blueprint = getProofBlueprint(assessment.skill);
    return {
      skill: assessment.skill,
      title: blueprint?.title ?? `Build something that proves ${assessment.skill}`,
      why: buildWhy(assessment, rankBySkill.get(assessment.skill) ?? index + 1, context),
      evidence_summary: assessment.evidence_summary,
      jd_frequency: assessment.frequency,
      est_hours: estimateHours(assessment),
      resources: getResources(assessment.skill).slice(0, 3),
      proof_project: buildProofProject(assessment.skill, partner),
    };
  });

  return packIntoWeeks(drafts, context.weekly_hours) satisfies PlannedItem[];
}

/** Pairs a gap with a nearby one that fits, so one project can close two gaps. */
function pickPartner(ordered: SkillAssessment[], index: number): string | null {
  const current = ordered[index];
  if (!current) return null;
  for (const offset of [1, 2, -1]) {
    const candidate = ordered[index + offset];
    if (candidate && canCombine(current, candidate)) return candidate.skill;
  }
  return null;
}

export function summarisePlan(items: PlannedItem[]): string {
  const weeks = new Set(items.map((item) => item.week)).size;
  const hours = items.reduce((sum, item) => sum + item.est_hours, 0);
  return `${items.length} items across ${weeks} weeks, ${hours} hours in total`;
}
