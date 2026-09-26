import { getStore } from '@/lib/db';
import { getRoleStats } from '@/lib/dataset';
import { generateJson, hashText } from '@/lib/llm';
import { planRoadmap, selectGaps, summarisePlan } from '@/lib/roadmap/plan';
import { buildRoadmapPrompt, ROADMAP_SYSTEM_PROMPT } from '@/lib/roadmap/prompt';
import { planSchema } from '@/lib/roadmap/schema';
import { validatePlan } from '@/lib/roadmap/validate';
import { horizonCapacity, hoursByWeek } from '@/lib/roadmap/hours';
import { diffRoadmaps } from '@/lib/roadmap/diff';
import type { PlanContext, PlannedItem } from '@/lib/roadmap/types';
import type { SkillAssessment } from '@/lib/scoring';
import { isRoleSlug } from '@/types/data';
import type { NewRoadmapItem } from '@/lib/db/types';
import type { Roadmap, RoadmapItem } from '@/types/domain';
import { loadProfileState } from './profile-state';
import { Tracer } from './trace';

export type BuildRoadmapResult = {
  roadmap: Roadmap;
  items: RoadmapItem[];
  changes: string[];
  source: 'model' | 'planner';
};

/**
 * Creates the next roadmap version for a profile.
 *
 * Items the student finished, skipped or edited are carried over untouched: the
 * agent is allowed to replan the future, never to rewrite decisions the student
 * already made. Everything else is planned again from the current gaps.
 */
export async function buildRoadmap(
  profileId: string,
  reason: string,
  options: { inheritApproval?: boolean } = {},
): Promise<BuildRoadmapResult> {
  const store = getStore();
  const state = await loadProfileState(profileId);
  if (!state) throw new Error('Profile not found');
  if (!isRoleSlug(state.profile.target_role)) throw new Error('Unknown target role');

  const tracer = new Tracer(profileId);
  const role = getRoleStats(state.profile.target_role);

  const previousItems = state.roadmap?.items ?? [];
  const locked = previousItems.filter(isLocked);
  const lockedHours = locked.reduce((sum, item) => sum + item.est_hours, 0);
  const lockedSkills = new Set(locked.map((item) => item.skill));
  const openGaps = state.gaps.filter((gap) => !lockedSkills.has(gap.skill));

  const context: PlanContext = {
    role: role.role,
    weekly_hours: state.profile.weekly_hours,
    total_weight: role.skills.reduce((sum, skill) => sum + skill.frequency, 0),
    // Items the student owns already consume part of the horizon, so the new
    // plan is sized against what is actually left rather than a fresh eight weeks.
    available_hours: Math.max(
      state.profile.weekly_hours,
      horizonCapacity(state.profile.weekly_hours) - lockedHours,
    ),
    reserved_weeks: hoursByWeek(locked),
  };

  const { items: planned, source } = await generatePlan(openGaps, context, tracer, state.demo);

  const version = (state.roadmap?.roadmap.version ?? 0) + 1;
  const created = await store.createRoadmap(profileId, version);
  // A replan triggered by progress keeps the approval the student already gave;
  // asking them to approve again after every quiz would be noise, not control.
  const roadmap =
    options.inheritApproval && state.roadmap?.roadmap.status === 'approved'
      ? await store.approveRoadmap(created.id)
      : created;

  const rows: NewRoadmapItem[] = [
    ...locked.map((item) => ({ ...toNewItem(item), roadmap_id: roadmap.id })),
    ...planned.map((item) => ({
      roadmap_id: roadmap.id,
      week: item.week,
      skill: item.skill,
      title: item.title,
      why: item.why,
      evidence_summary: item.evidence_summary,
      jd_frequency: item.jd_frequency,
      est_hours: item.est_hours,
      resources: item.resources,
      proof_project: item.proof_project,
      status: 'todo' as const,
      user_edited: false,
      order_index: item.order_index,
    })),
  ];

  const items = await store.insertRoadmapItems(rows);
  const changes = version > 1 ? diffRoadmaps(previousItems, items) : [];

  await tracer.info(
    'Roadmap version created',
    `Version ${version}: ${summarisePlan(planned)}${locked.length > 0 ? `, ${locked.length} items kept as you left them` : ''}. ${reason}`,
  );
  if (context.reserved_weeks.size > 0) {
    await tracer.info(
      'Existing weeks respected',
      `Hours already committed in ${context.reserved_weeks.size} weeks were left in place when repacking`,
    );
  }

  return { roadmap, items, changes, source };
}

async function generatePlan(
  gaps: SkillAssessment[],
  context: PlanContext,
  tracer: Tracer,
  isDemo: boolean,
): Promise<{ items: PlannedItem[]; source: 'model' | 'planner' }> {
  if (gaps.length === 0) {
    await tracer.info('Nothing left to plan', 'Every role skill is already proven at this level');
    return { items: [], source: 'planner' };
  }

  const fallback = () => planRoadmap(gaps, context);
  // The model only sees the gaps that can fit the horizon, which keeps the
  // prompt inside the tightest free tier token budget in the chain.
  const plannable = selectGaps(gaps, context).selected;

  const { value, source } = await generateJson({
    schema: planSchema,
    system: ROADMAP_SYSTEM_PROMPT,
    user: buildRoadmapPrompt(plannable, context),
    // The gap signature is part of the key even for the demo profile: a replan
    // has a different gap set and must not replay the first plan from cache.
    cacheKey: `${isDemo ? 'demo' : 'live'}:roadmap:${context.weekly_hours}:${gapSignature(plannable)}`,
    logger: tracer,
    // An empty item list is the signal to plan deterministically below; the
    // planner produces finished items rather than the model's draft shape.
    fallback: () => ({ items: [] }),
  });

  if (source === 'fallback' || value.items.length === 0) {
    const items = fallback();
    await tracer.info(
      'Deterministic planner used',
      `No model plan available, built the roadmap from the ranked gaps: ${summarisePlan(items)}`,
    );
    return { items, source: 'planner' };
  }

  try {
    const report = validatePlan(value, gaps, context);
    if (report.dropped_urls > 0) {
      await tracer.warn(
        'Resources filtered',
        `${report.dropped_urls} links were not in the approved resource list and were removed`,
      );
    }
    if (report.dropped_items > 0) {
      await tracer.warn(
        'Plan items removed',
        `${report.dropped_items} items named a skill outside your gap list`,
      );
    }
    if (report.rescheduled) {
      await tracer.info(
        'Weeks repacked',
        `The plan was rescheduled to respect your ${context.weekly_hours} hour weekly budget`,
      );
    }
    return { items: report.items, source: 'model' };
  } catch (error) {
    await tracer.warn(
      'Plan rejected',
      `${error instanceof Error ? error.message : 'Validation failed'} Falling back to the deterministic planner.`,
    );
    return { items: fallback(), source: 'planner' };
  }
}

function gapSignature(gaps: SkillAssessment[]): string {
  return hashText(gaps.map((gap) => `${gap.skill}:${gap.proficiency}`).join('|'));
}

function isLocked(item: RoadmapItem): boolean {
  return item.status === 'done' || item.status === 'skipped' || item.user_edited;
}

/** Copies a locked item onto the next roadmap version, dropping only its id. */
function toNewItem(item: RoadmapItem): NewRoadmapItem {
  const copy: Partial<RoadmapItem> = { ...item };
  delete copy.id;
  return copy as NewRoadmapItem;
}
