import type { RoadmapItem } from '@/types/domain';

type Comparable = Pick<RoadmapItem, 'skill' | 'week' | 'status'>;

/**
 * Plain sentences describing what a replan changed, shown on the roadmap as the
 * "what changed" box. Written from the item lists rather than from the model, so
 * the explanation can never disagree with the plan on screen.
 */
export function diffRoadmaps(previous: Comparable[], next: Comparable[]): string[] {
  const before = new Map(previous.map((item) => [item.skill, item]));
  const after = new Map(next.map((item) => [item.skill, item]));
  const changes: string[] = [];

  const moved: string[] = [];
  for (const [skill, item] of after) {
    const old = before.get(skill);
    if (!old) {
      changes.push(`${skill} was added to the plan.`);
      continue;
    }
    if (old.week !== item.week) {
      moved.push(`${skill} moved from week ${old.week} to week ${item.week}`);
    }
  }

  for (const [skill, item] of before) {
    if (after.has(skill)) continue;
    changes.push(
      item.status === 'done'
        ? `${skill} left the plan because you finished it.`
        : `${skill} left the plan because it is no longer one of your largest gaps.`,
    );
  }

  if (moved.length > 0) {
    changes.unshift(`${moved.join(', ')}.`);
  }

  return changes;
}

export function describeScoreChange(previous: number | null, next: number): string {
  if (previous === null) return `Readiness is ${next} out of 100.`;
  const delta = Math.round((next - previous) * 10) / 10;
  if (delta === 0) return `Readiness stayed at ${next} out of 100.`;
  return `Readiness moved from ${previous} to ${next} out of 100, a change of ${delta > 0 ? '+' : ''}${delta}.`;
}
