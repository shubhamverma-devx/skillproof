import { ROADMAP } from '@/lib/config';

export type Schedulable = { est_hours: number };
export type Scheduled<T> = T & { week: number; order_index: number };

/**
 * Packs items into weeks so no week exceeds the student's hour budget, keeping
 * the given order. This runs after the model has sequenced the plan, because a
 * model will happily put eleven hours into an eight hour week.
 */
export function packIntoWeeks<T extends Schedulable>(
  items: T[],
  weeklyHours: number,
  /** Hours already committed per week, for example by items the student finished. */
  reserved: Map<number, number> = new Map(),
): Array<Scheduled<T>> {
  const budget = Math.max(ROADMAP.minItemHours, weeklyHours);
  const packed: Array<Scheduled<T>> = [];

  let week = 1;
  let usedThisWeek = reserved.get(1) ?? 0;
  let orderInWeek = reserved.has(1) ? 1 : 0;

  for (const item of items) {
    // A single item larger than the whole week is trimmed rather than dropped,
    // otherwise it could never be scheduled at all.
    const hours = Math.min(item.est_hours, budget);

    while (usedThisWeek > 0 && usedThisWeek + hours > budget) {
      week += 1;
      usedThisWeek = reserved.get(week) ?? 0;
      orderInWeek = reserved.has(week) ? 1 : 0;
    }

    packed.push({ ...item, est_hours: hours, week, order_index: orderInWeek });
    usedThisWeek += hours;
    orderInWeek += 1;
  }

  return packed;
}

/** Hours per week, used by the roadmap header and by the replan diff. */
export function hoursByWeek(items: Array<{ week: number; est_hours: number }>): Map<number, number> {
  const totals = new Map<number, number>();
  for (const item of items) {
    totals.set(item.week, (totals.get(item.week) ?? 0) + item.est_hours);
  }
  return totals;
}

/** How many hours of learning fit in the planning horizon. */
export function horizonCapacity(weeklyHours: number, weeks = ROADMAP.defaultWeeks): number {
  return weeklyHours * weeks;
}
